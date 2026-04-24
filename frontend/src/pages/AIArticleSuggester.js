import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AIArticleSuggester = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [suggestions, setSuggestions] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    target_audience: '',
    difficulty: 'Intermediate'
  });

  useEffect(() => {
    fetchSuggestions();
  }, []);

  useEffect(() => {
    if (id) {
      fetchSuggestionDetail(id);
    }
  }, [id]);

  const fetchSuggestions = async () => {
    try {
      const response = await api.get('/ai/article-suggestions');
      setSuggestions(response.data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestionDetail = async (suggestionId) => {
    try {
      const response = await api.get(`/ai/article-suggestions/${suggestionId}`);
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to fetch suggestion detail:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.topic.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/ai/article-suggestions', formData);
      setSuggestions([response.data, ...suggestions]);
      setShowForm(false);
      setFormData({ topic: '', target_audience: '', difficulty: 'Intermediate' });
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to create suggestion:', error);
      alert('Failed to generate suggestion. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const response = await api.put(`/ai/article-suggestions/${selectedItem.id}`, {
        topic: selectedItem.topic,
        title: selectedItem.title,
        summary: selectedItem.summary,
        target_audience: selectedItem.target_audience,
        difficulty: selectedItem.difficulty,
        status: selectedItem.status
      });
      setSuggestions(suggestions.map(s => s.id === response.data.id ? response.data : s));
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update suggestion:', error);
      alert('Failed to update suggestion');
    }
  };

  const handleDelete = async (suggestionId) => {
    if (!window.confirm('Are you sure you want to delete this suggestion?')) return;
    try {
      await api.delete(`/ai/article-suggestions/${suggestionId}`);
      setSuggestions(suggestions.filter(s => s.id !== suggestionId));
      if (selectedItem?.id === suggestionId) {
        setShowDetail(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete suggestion:', error);
      alert('Failed to delete suggestion');
    }
  };

  const parseJSON = (str) => {
    if (!str) return null;
    try {
      return typeof str === 'string' ? JSON.parse(str) : str;
    } catch { return null; }
  };

  const renderAIOutput = (item) => {
    // Build display data from item's direct DB fields instead of re-parsing ai_response
    const parsed = {
      title: item.title || null,
      summary: item.summary || null,
      outline: parseJSON(item.outline),
      keywords: item.keywords ? item.keywords.split(', ') : null,
      targetAudience: item.target_audience || null,
      difficulty: item.difficulty || null,
      estimatedLength: item.estimated_length || null,
      relatedTopics: null
    };

    // Try to extract relatedTopics from ai_response as a bonus (not stored individually)
    try {
      if (item.ai_response) {
        let aiParsed = typeof item.ai_response === 'string' ? JSON.parse(item.ai_response) : item.ai_response;
        if (typeof aiParsed === 'string') aiParsed = JSON.parse(aiParsed.replace(/```json\n?|\n?```/g, ''));
        if (aiParsed?.relatedTopics) parsed.relatedTopics = aiParsed.relatedTopics;
      }
    } catch {}

    // Check if we have any data to display
    const hasData = parsed.title || parsed.summary || parsed.outline || parsed.keywords ||
      parsed.targetAudience || parsed.difficulty || parsed.estimatedLength || parsed.relatedTopics;

    if (!hasData) {
      return (
        <div style={{ padding: '1.5rem', background: '#F3F4F6', borderRadius: '0.75rem', textAlign: 'center', color: '#6B7280' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</div>
          <div>No detailed data available for this suggestion.</div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {parsed.title && (
          <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', padding: '1.5rem', borderRadius: '0.75rem', color: 'white' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.8, marginBottom: '0.5rem' }}>Suggested Title</div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>{parsed.title}</h3>
          </div>
        )}

        {parsed.summary && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📝</span> Summary
            </div>
            <p style={{ color: '#15803D', margin: 0, lineHeight: 1.6 }}>{parsed.summary}</p>
          </div>
        )}

        {parsed.outline && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Article Outline
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#78350F' }}>
              {(Array.isArray(parsed.outline) ? parsed.outline : []).map((item, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>{item}</li>
              ))}
            </ol>
          </div>
        )}

        {parsed.keywords && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#1E40AF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🏷️</span> Keywords
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(Array.isArray(parsed.keywords) ? parsed.keywords : parsed.keywords?.split(',') || []).map((kw, idx) => (
                <span key={idx} style={{ background: '#DBEAFE', color: '#1D4ED8', padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem' }}>
                  {kw.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {parsed.targetAudience && (
            <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>👥</div>
              <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 500 }}>Target Audience</div>
              <div style={{ fontSize: '0.875rem', color: '#5B21B6', marginTop: '0.25rem' }}>{parsed.targetAudience}</div>
            </div>
          )}
          {parsed.difficulty && (
            <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📊</div>
              <div style={{ fontSize: '0.75rem', color: '#DB2777', fontWeight: 500 }}>Difficulty</div>
              <div style={{ fontSize: '0.875rem', color: '#9D174D', marginTop: '0.25rem' }}>{parsed.difficulty}</div>
            </div>
          )}
          {parsed.estimatedLength && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📏</div>
              <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500 }}>Length</div>
              <div style={{ fontSize: '0.875rem', color: '#047857', marginTop: '0.25rem' }}>{parsed.estimatedLength}</div>
            </div>
          )}
        </div>

        {parsed.relatedTopics && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FDBA74', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#C2410C', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔗</span> Related Topics
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {(Array.isArray(parsed.relatedTopics) ? parsed.relatedTopics : []).map((topic, idx) => (
                <span key={idx} style={{ background: '#FFEDD5', color: '#9A3412', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}
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
          <h1 className="page-title">💡 AI Article Suggester</h1>
          <p className="page-subtitle">Get AI-powered suggestions for new articles</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/ai-features')}>
            ← Back to AI Features
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Suggestion
          </button>
        </div>
      </div>

      {/* List View */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Article Suggestions ({suggestions.length})</h3>
        </div>
        <div className="card-body">
          {suggestions.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Title</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{item.topic}</td>
                      <td>{item.title || '-'}</td>
                      <td>
                        <span className={`badge ${item.difficulty === 'Beginner' ? 'badge-success' : item.difficulty === 'Advanced' ? 'badge-danger' : 'badge-warning'}`}>
                          {item.difficulty || 'Intermediate'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${item.status === 'generated' ? 'badge-primary' : 'badge-gray'}`}>
                          {item.status || 'pending'}
                        </span>
                      </td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
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
              <div className="empty-icon">💡</div>
              <div className="empty-title">No article suggestions yet</div>
              <div className="empty-text">Create your first AI-powered article suggestion</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Create Suggestion
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Article Suggestion</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Sample Data</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { label: 'Docker Containerization', topic: 'Docker Containerization', target_audience: 'Junior DevOps engineers', difficulty: 'Beginner' },
                    { label: 'GraphQL vs REST APIs', topic: 'GraphQL vs REST APIs', target_audience: 'Backend developers', difficulty: 'Intermediate' },
                    { label: 'Kubernetes Security', topic: 'Kubernetes Security Best Practices', target_audience: 'DevOps engineers', difficulty: 'Advanced' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ topic: sample.topic, target_audience: sample.target_audience, difficulty: sample.difficulty })}
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
              <div className="form-group">
                <label className="form-label">Topic *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., Getting Started with Docker"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="e.g., Beginner developers"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty Level</label>
                <select
                  className="form-input"
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={generating || !formData.topic.trim()}>
                {generating ? '⏳ Generating...' : '✨ Generate Suggestion'}
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
                {editMode ? 'Edit Suggestion' : 'Suggestion Details'}
              </h3>
              <button className="modal-close" onClick={() => { setShowDetail(false); setEditMode(false); }}>&times;</button>
            </div>
            <div className="modal-body">
              {editMode ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Topic</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedItem.topic || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, topic: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedItem.title || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, title: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Summary</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={selectedItem.summary || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, summary: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Target Audience</label>
                      <input
                        type="text"
                        className="form-input"
                        value={selectedItem.target_audience || ''}
                        onChange={(e) => setSelectedItem({ ...selectedItem, target_audience: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Difficulty</label>
                      <select
                        className="form-input"
                        value={selectedItem.difficulty || 'Intermediate'}
                        onChange={(e) => setSelectedItem({ ...selectedItem, difficulty: e.target.value })}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>Topic</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{selectedItem.topic}</div>
                  </div>
                  <h4 style={{ marginBottom: '1rem', color: '#374151' }}>AI Generated Content</h4>
                  {renderAIOutput(selectedItem)}
                </>
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
                  <button className="btn btn-primary" onClick={() => navigate(`/articles/new?title=${encodeURIComponent(selectedItem.title || selectedItem.topic)}`)}>
                    Create Article
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

export default AIArticleSuggester;
