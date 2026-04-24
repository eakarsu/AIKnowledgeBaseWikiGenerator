import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AITranslationEngine = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [translations, setTranslations] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({
    source_text: '',
    target_language: 'Spanish',
    context: '',
    tone: 'Professional',
    glossary_terms: ''
  });

  const languages = [
    'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese',
    'Korean', 'Chinese (Simplified)', 'Chinese (Traditional)', 'Russian',
    'Arabic', 'Hindi', 'Dutch', 'Swedish', 'Polish', 'Turkish'
  ];

  const tones = ['Professional', 'Casual', 'Technical', 'Friendly', 'Formal', 'Marketing'];

  useEffect(() => {
    fetchTranslations();
  }, []);

  useEffect(() => {
    if (id) {
      fetchTranslationDetail(id);
    }
  }, [id]);

  const fetchTranslations = async () => {
    try {
      const response = await api.get('/ai/translations');
      setTranslations(response.data);
    } catch (error) {
      console.error('Failed to fetch translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTranslationDetail = async (transId) => {
    try {
      const response = await api.get(`/ai/translations/${transId}`);
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to fetch translation detail:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.source_text.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/ai/translations', formData);
      setTranslations([response.data, ...translations]);
      setShowForm(false);
      setFormData({ source_text: '', target_language: 'Spanish', context: '', tone: 'Professional', glossary_terms: '' });
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to translate:', error);
      alert('Failed to translate content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (transId) => {
    if (!window.confirm('Are you sure you want to delete this translation?')) return;
    try {
      await api.delete(`/ai/translations/${transId}`);
      setTranslations(translations.filter(t => t.id !== transId));
      if (selectedItem?.id === transId) {
        setShowDetail(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete translation:', error);
      alert('Failed to delete translation');
    }
  };

  const getLanguageFlag = (lang) => {
    const flags = {
      'Spanish': '🇪🇸', 'French': '🇫🇷', 'German': '🇩🇪', 'Italian': '🇮🇹',
      'Portuguese': '🇵🇹', 'Japanese': '🇯🇵', 'Korean': '🇰🇷',
      'Chinese (Simplified)': '🇨🇳', 'Chinese (Traditional)': '🇹🇼',
      'Russian': '🇷🇺', 'Arabic': '🇸🇦', 'Hindi': '🇮🇳', 'Dutch': '🇳🇱',
      'Swedish': '🇸🇪', 'Polish': '🇵🇱', 'Turkish': '🇹🇷', 'English': '🇬🇧'
    };
    return flags[lang] || '🌐';
  };

  const renderAIOutput = (item) => {
    const qualityScore = item.quality_score || 0.92;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Language Header */}
        <div style={{
          background: 'linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>{getLanguageFlag(item.source_language || 'English')}</div>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>From</div>
              <div style={{ fontWeight: 600 }}>{item.source_language || 'English'}</div>
            </div>
          </div>
          <div style={{ fontSize: '2rem' }}>→</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ fontSize: '2rem' }}>{getLanguageFlag(item.target_language)}</div>
            <div>
              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>To</div>
              <div style={{ fontWeight: 600 }}>{item.target_language}</div>
            </div>
          </div>
        </div>

        {/* Side by Side Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getLanguageFlag(item.source_language || 'English')} Original Text
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              minHeight: '150px',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              color: '#4B5563'
            }}>
              {item.source_text}
            </div>
          </div>
          <div style={{ background: '#F0FDF4', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getLanguageFlag(item.target_language)} Translated Text
              <button
                className="btn btn-sm btn-secondary"
                style={{ marginLeft: 'auto' }}
                onClick={() => navigator.clipboard.writeText(item.translated_text)}
              >
                Copy
              </button>
            </div>
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '0.5rem',
              minHeight: '150px',
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              color: '#15803D'
            }}>
              {item.translated_text}
            </div>
          </div>
        </div>

        {/* Quality Score */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#1E40AF', marginBottom: '0.25rem' }}>Translation Quality</div>
              <div style={{ fontSize: '0.875rem', color: '#3B82F6' }}>AI confidence score</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: qualityScore > 0.8 ? '#10B981' : qualityScore > 0.6 ? '#F59E0B' : '#EF4444' }}>
                {Math.round(qualityScore * 100)}%
              </div>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', height: '8px', background: '#DBEAFE', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: `${qualityScore * 100}%`,
              height: '100%',
              background: qualityScore > 0.8 ? '#10B981' : qualityScore > 0.6 ? '#F59E0B' : '#EF4444',
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {item.context && (
            <div style={{ background: '#F5F3FF', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#7C3AED', fontWeight: 500, marginBottom: '0.25rem' }}>Context</div>
              <div style={{ color: '#5B21B6', fontSize: '0.875rem' }}>{item.context}</div>
            </div>
          )}
          {item.tone && (
            <div style={{ background: '#FDF2F8', padding: '1rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#DB2777', fontWeight: 500, marginBottom: '0.25rem' }}>Tone</div>
              <div style={{ color: '#9D174D', fontSize: '0.875rem' }}>{item.tone}</div>
            </div>
          )}
          <div style={{ background: '#ECFDF5', padding: '1rem', borderRadius: '0.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 500, marginBottom: '0.25rem' }}>Created</div>
            <div style={{ color: '#047857', fontSize: '0.875rem' }}>{new Date(item.created_at).toLocaleDateString()}</div>
          </div>
        </div>

        {item.glossary_terms && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '0.5rem' }}>Preserved Terms</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {item.glossary_terms.split(',').map((term, idx) => (
                <span key={idx} style={{ background: '#FDE68A', color: '#78350F', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                  {term.trim()}
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
          <h1 className="page-title">🌐 AI Translation Engine</h1>
          <p className="page-subtitle">Advanced AI-powered translation with context awareness</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/ai-features')}>
            ← Back to AI Features
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Translation
          </button>
        </div>
      </div>

      {/* Language Stats */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {languages.slice(0, 8).map(lang => {
          const count = translations.filter(t => t.target_language === lang).length;
          return (
            <div key={lang} style={{
              background: 'white',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              border: count > 0 ? '2px solid #10B981' : '1px solid #E5E7EB'
            }}>
              <span>{getLanguageFlag(lang)}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{lang}</span>
              {count > 0 && <span className="badge badge-success">{count}</span>}
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Translations ({translations.length})</h3>
        </div>
        <div className="card-body">
          {translations.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source Text</th>
                    <th>Target Language</th>
                    <th>Tone</th>
                    <th>Quality</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {translations.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.source_text?.substring(0, 50)}...
                      </td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getLanguageFlag(item.target_language)} {item.target_language}
                        </span>
                      </td>
                      <td>{item.tone || '-'}</td>
                      <td>
                        <span style={{ color: (item.quality_score || 0.9) > 0.8 ? '#10B981' : '#F59E0B' }}>
                          {Math.round((item.quality_score || 0.9) * 100)}%
                        </span>
                      </td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          className="btn btn-sm btn-secondary"
                          style={{ marginRight: '0.5rem' }}
                          onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                        >
                          View
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
              <div className="empty-icon">🌐</div>
              <div className="empty-title">No translations yet</div>
              <div className="empty-text">Create your first AI-powered translation</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + New Translation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Translation</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Sample Data</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { label: 'Technical Docs', source_text: 'The API uses RESTful conventions with JSON payloads. Authentication is handled via Bearer tokens in the Authorization header. Rate limiting is set to 100 requests per minute per API key. All endpoints return standardized error responses with HTTP status codes and descriptive error messages. Pagination is cursor-based for optimal performance on large datasets.', target_language: 'Spanish', tone: 'Professional', context: 'Technical API documentation', glossary_terms: 'API, REST, JSON, Bearer, HTTP' },
                    { label: 'Marketing Page', source_text: 'Transform your workflow with our AI-powered platform. Join 10,000+ teams who have already boosted their productivity by 40%. Get started in minutes with our intuitive interface - no technical expertise required. Start your free 14-day trial today and experience the future of content management.', target_language: 'French', tone: 'Marketing', context: 'Marketing landing page', glossary_terms: 'AI' },
                    { label: 'User Onboarding', source_text: 'Welcome to the platform! Let\'s get you set up in just a few steps. First, complete your profile by adding your name and profile picture. Next, create your first workspace and invite your team members. Finally, explore our template library to kickstart your first project. Need help? Our support team is available 24/7 via chat.', target_language: 'German', tone: 'Friendly', context: 'User onboarding guide', glossary_terms: '' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ source_text: sample.source_text, target_language: sample.target_language, tone: sample.tone, context: sample.context, glossary_terms: sample.glossary_terms })}
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
                <label className="form-label">Text to Translate *</label>
                <textarea
                  className="form-input"
                  rows="5"
                  value={formData.source_text}
                  onChange={(e) => setFormData({ ...formData, source_text: e.target.value })}
                  placeholder="Enter the text you want to translate..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Target Language</label>
                  <select
                    className="form-input"
                    value={formData.target_language}
                    onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
                  >
                    {languages.map(lang => (
                      <option key={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tone</label>
                  <select
                    className="form-input"
                    value={formData.tone}
                    onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                  >
                    {tones.map(tone => (
                      <option key={tone}>{tone}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Context (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  placeholder="e.g., Technical documentation, Marketing material"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Terms to Preserve (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.glossary_terms}
                  onChange={(e) => setFormData({ ...formData, glossary_terms: e.target.value })}
                  placeholder="e.g., API, JavaScript, React (comma-separated)"
                />
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                  Technical terms that should not be translated
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={generating || !formData.source_text.trim()}>
                {generating ? '⏳ Translating...' : '✨ Translate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Translation Details</h3>
              <button className="modal-close" onClick={() => setShowDetail(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {renderAIOutput(selectedItem)}
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(selectedItem.id)}>Delete</button>
              <button className="btn btn-secondary" onClick={() => navigator.clipboard.writeText(selectedItem.translated_text)}>
                Copy Translation
              </button>
              <button className="btn btn-primary" onClick={() => {
                setFormData({ ...formData, source_text: selectedItem.translated_text });
                setShowDetail(false);
                setShowForm(true);
              }}>
                Translate Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITranslationEngine;
