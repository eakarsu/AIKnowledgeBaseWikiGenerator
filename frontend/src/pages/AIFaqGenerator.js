import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AIFaqGenerator = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [faqs, setFaqs] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    topic: '',
    category: 'General'
  });

  const categories = ['General', 'Technical', 'Billing', 'Account', 'Features', 'Troubleshooting', 'Getting Started', 'API', 'Security', 'Integration'];

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (id) {
      fetchFaqDetail(id);
    }
  }, [id]);

  const fetchFaqs = async () => {
    try {
      const response = await api.get('/ai/faqs');
      setFaqs(response.data);
    } catch (error) {
      console.error('Failed to fetch FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqDetail = async (faqId) => {
    try {
      const response = await api.get(`/ai/faqs/${faqId}`);
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to fetch FAQ detail:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.question.trim() && !formData.topic.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/ai/faqs', formData);
      setFaqs([response.data, ...faqs]);
      setShowForm(false);
      setFormData({ question: '', answer: '', topic: '', category: 'General' });
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to create FAQ:', error);
      alert('Failed to generate FAQ. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleBulkGenerate = async () => {
    if (!formData.topic.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/ai/faqs/bulk', { topic: formData.topic, context: formData.answer });
      setFaqs([...response.data.faqs, ...faqs]);
      setShowForm(false);
      setBulkMode(false);
      setFormData({ question: '', answer: '', topic: '', category: 'General' });
      alert(`Generated ${response.data.count} FAQs successfully!`);
    } catch (error) {
      console.error('Failed to generate bulk FAQs:', error);
      alert('Failed to generate FAQs. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const response = await api.put(`/ai/faqs/${selectedItem.id}`, {
        question: selectedItem.question,
        answer: selectedItem.answer,
        category: selectedItem.category,
        topic: selectedItem.topic,
        status: selectedItem.status
      });
      setFaqs(faqs.map(f => f.id === response.data.id ? response.data : f));
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update FAQ:', error);
      alert('Failed to update FAQ');
    }
  };

  const handleDelete = async (faqId) => {
    if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await api.delete(`/ai/faqs/${faqId}`);
      setFaqs(faqs.filter(f => f.id !== faqId));
      if (selectedItem?.id === faqId) {
        setShowDetail(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      alert('Failed to delete FAQ');
    }
  };

  const parseJSON = (str) => {
    if (!str) return null;
    try {
      return typeof str === 'string' ? JSON.parse(str) : str;
    } catch {
      return null;
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'General': '#6B7280',
      'Technical': '#3B82F6',
      'Billing': '#10B981',
      'Account': '#8B5CF6',
      'Features': '#EC4899',
      'Troubleshooting': '#EF4444',
      'Getting Started': '#F59E0B',
      'API': '#14B8A6',
      'Security': '#DC2626',
      'Integration': '#6366F1'
    };
    return colors[category] || '#6B7280';
  };

  const renderAIOutput = (item) => {
    const relatedQuestions = parseJSON(item.related_questions);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Question Card */}
        <div style={{
          background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              flexShrink: 0
            }}>
              ?
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, marginBottom: '0.5rem' }}>
                Question
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 }}>
                {item.question}
              </div>
            </div>
          </div>
        </div>

        {/* Answer Card */}
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.5rem', borderRadius: '0.75rem' }}>
          <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>A</span> Answer
          </div>
          <div style={{
            color: '#15803D',
            lineHeight: 1.7,
            fontSize: '1rem',
            whiteSpace: 'pre-wrap'
          }}>
            {item.answer}
          </div>
        </div>

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{
            background: `${getCategoryColor(item.category)}15`,
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            border: `1px solid ${getCategoryColor(item.category)}30`
          }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
              <span style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getCategoryColor(item.category)
              }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Category</div>
            <div style={{ fontWeight: 500, color: getCategoryColor(item.category) }}>{item.category || 'General'}</div>
          </div>
          {item.topic && (
            <div style={{ background: '#EFF6FF', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🏷️</div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Topic</div>
              <div style={{ fontWeight: 500, color: '#1D4ED8' }}>{item.topic}</div>
            </div>
          )}
          <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>📅</div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Created</div>
            <div style={{ fontWeight: 500, color: '#374151' }}>{new Date(item.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Helpfulness */}
        <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '1rem', borderRadius: '0.75rem' }}>
          <div style={{ fontWeight: 600, color: '#5B21B6', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span> Helpfulness Score
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👍</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#10B981' }}>{item.helpful_count || 0}</span>
              <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>found helpful</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>👎</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#EF4444' }}>{item.not_helpful_count || 0}</span>
              <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>not helpful</span>
            </div>
          </div>
        </div>

        {/* Related Questions */}
        {relatedQuestions && Array.isArray(relatedQuestions) && relatedQuestions.length > 0 && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔗</span> Related Questions
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350F' }}>
              {relatedQuestions.map((q, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>{q}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Status */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
            {item.status || 'active'}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">FAQ Generator</h1>
          <p className="page-subtitle">Automatically generate FAQs from topics and content</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/ai-features')}>
            ← Back to AI Features
          </button>
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setBulkMode(false); }}>
            + New FAQ
          </button>
          <button className="btn btn-secondary" style={{ background: '#8B5CF6', color: 'white', borderColor: '#8B5CF6' }} onClick={() => { setShowForm(true); setBulkMode(true); }}>
            Bulk Generate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid #3B82F6' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3B82F6' }}>{faqs.length}</div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Total FAQs</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid #10B981' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10B981' }}>{faqs.filter(f => f.status === 'active').length}</div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Active</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid #F59E0B' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#F59E0B' }}>{new Set(faqs.map(f => f.category)).size}</div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Categories</div>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', borderLeft: '4px solid #8B5CF6' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#8B5CF6' }}>{faqs.reduce((acc, f) => acc + (f.helpful_count || 0), 0)}</div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Helpful Votes</div>
        </div>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {categories.map(cat => {
          const count = faqs.filter(f => f.category === cat).length;
          if (count === 0) return null;
          return (
            <div key={cat} style={{
              background: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: `1px solid ${getCategoryColor(cat)}40`
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: getCategoryColor(cat)
              }} />
              <span style={{ fontSize: '0.875rem', color: '#374151' }}>{cat}</span>
              <span style={{
                background: `${getCategoryColor(cat)}20`,
                color: getCategoryColor(cat),
                padding: '0.125rem 0.5rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600
              }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">FAQ Entries ({faqs.length})</h3>
        </div>
        <div className="card-body">
          {faqs.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Category</th>
                    <th>Topic</th>
                    <th>Status</th>
                    <th>Helpful</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {item.question}
                      </td>
                      <td>
                        <span style={{
                          background: `${getCategoryColor(item.category)}20`,
                          color: getCategoryColor(item.category),
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}>
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td style={{ color: '#6B7280' }}>{item.topic || '-'}</td>
                      <td>
                        <span className={`badge ${item.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                          {item.status || 'active'}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#10B981' }}>👍 {item.helpful_count || 0}</span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ marginRight: '0.5rem' }}
                          onClick={() => { setSelectedItem(item); setShowDetail(true); setEditMode(true); }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">?</div>
              <div className="empty-title">No FAQs yet</div>
              <div className="empty-text">Generate your first AI-powered FAQ</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Create FAQ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setBulkMode(false); }}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{bulkMode ? 'Bulk Generate FAQs' : 'Create FAQ Entry'}</h3>
              <button className="modal-close" onClick={() => { setShowForm(false); setBulkMode(false); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Sample Data</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { label: 'Getting Started', topic: 'Getting Started with Our Platform', question: 'How do I create my first project on the platform?', category: 'Getting Started', answer: '' },
                    { label: 'API Security', topic: 'API Authentication & Security', question: 'How do I authenticate API requests and manage API keys?', category: 'API', answer: '' },
                    { label: 'Billing & Plans', topic: 'Billing & Subscription Management', question: 'How do I upgrade my subscription plan and manage billing?', category: 'Billing', answer: '' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ question: bulkMode ? '' : sample.question, answer: sample.answer, topic: sample.topic, category: sample.category })}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '9999px',
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        fontSize: '0.8125rem',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => { e.target.style.background = '#F3F4F6'; e.target.style.borderColor = '#3B82F6'; }}
                      onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#E5E7EB'; }}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
              {bulkMode ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Topic *</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      placeholder="e.g., Getting Started with Our Platform"
                    />
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                      AI will generate multiple FAQs about this topic
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Additional Context (Optional)</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Provide any additional context that should be considered when generating FAQs..."
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Question {!formData.topic && '*'}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="e.g., How do I reset my password?"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Answer (Optional - AI will generate if empty)</label>
                    <textarea
                      className="form-input"
                      rows="4"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="Leave empty to let AI generate an answer..."
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Topic (for AI generation)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="e.g., Account Management"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        {categories.map(cat => (
                          <option key={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setShowForm(false); setBulkMode(false); }}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={bulkMode ? handleBulkGenerate : handleCreate}
                disabled={generating || (bulkMode ? !formData.topic.trim() : (!formData.question.trim() && !formData.topic.trim()))}
              >
                {generating ? 'Generating...' : bulkMode ? 'Generate Multiple FAQs' : 'Create FAQ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => { setShowDetail(false); setEditMode(false); }}>
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editMode ? 'Edit FAQ' : 'FAQ Details'}
              </h3>
              <button className="modal-close" onClick={() => { setShowDetail(false); setEditMode(false); }}>&times;</button>
            </div>
            <div className="modal-body">
              {editMode ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Question</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedItem.question || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, question: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Answer</label>
                    <textarea
                      className="form-input"
                      rows="6"
                      value={selectedItem.answer || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, answer: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Category</label>
                      <select
                        className="form-input"
                        value={selectedItem.category || 'General'}
                        onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })}
                      >
                        {categories.map(cat => (
                          <option key={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Status</label>
                      <select
                        className="form-input"
                        value={selectedItem.status || 'active'}
                        onChange={(e) => setSelectedItem({ ...selectedItem, status: e.target.value })}
                      >
                        <option>active</option>
                        <option>inactive</option>
                        <option>draft</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                renderAIOutput(selectedItem)
              )}
            </div>
            <div className="modal-footer">
              {editMode ? (
                <>
                  <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleUpdate}>Save Changes</button>
                </>
              ) : (
                <>
                  <button className="btn btn-danger" onClick={() => handleDelete(selectedItem.id)}>Delete</button>
                  <button className="btn btn-secondary" onClick={() => setEditMode(true)}>Edit</button>
                  <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(`Q: ${selectedItem.question}\n\nA: ${selectedItem.answer}`)}>
                    Copy Q&A
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFaqGenerator;
