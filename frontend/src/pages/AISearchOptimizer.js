import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AISearchOptimizer = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [optimizations, setOptimizations] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({ original_query: '' });

  useEffect(() => {
    fetchOptimizations();
  }, []);

  useEffect(() => {
    if (id) {
      fetchOptimizationDetail(id);
    }
  }, [id]);

  const fetchOptimizations = async () => {
    try {
      const response = await api.get('/ai/search-optimize');
      setOptimizations(response.data);
    } catch (error) {
      console.error('Failed to fetch optimizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptimizationDetail = async (optId) => {
    try {
      const response = await api.get(`/ai/search-optimize/${optId}`);
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to fetch optimization detail:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.original_query.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/ai/search-optimize', formData);
      setOptimizations([response.data, ...optimizations]);
      setShowForm(false);
      setFormData({ original_query: '' });
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to create optimization:', error);
      alert('Failed to optimize search. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (optId) => {
    if (!window.confirm('Are you sure you want to delete this optimization?')) return;
    try {
      await api.delete(`/ai/search-optimize/${optId}`);
      setOptimizations(optimizations.filter(o => o.id !== optId));
      if (selectedItem?.id === optId) {
        setShowDetail(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete optimization:', error);
      alert('Failed to delete optimization');
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

  const renderAIOutput = (item) => {
    const suggestions = parseJSON(item.suggestions);
    const synonyms = parseJSON(item.synonyms);
    const relatedTerms = parseJSON(item.related_terms);
    const searchTips = parseJSON(item.search_tips);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Original vs Optimized */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#991B1B', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Original Query
            </div>
            <div style={{ fontSize: '1.125rem', color: '#7F1D1D' }}>{item.original_query}</div>
          </div>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.5rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              Optimized Query
            </div>
            <div style={{ fontSize: '1.125rem', color: '#15803D' }}>{item.optimized_query || item.original_query}</div>
          </div>
        </div>

        {/* Alternative Suggestions */}
        {suggestions && Array.isArray(suggestions) && suggestions.length > 0 && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#1E40AF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💡</span> Alternative Search Queries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigator.clipboard.writeText(suggestion)}
                >
                  <span style={{ color: '#3B82F6', fontWeight: 600 }}>{idx + 1}.</span>
                  <span style={{ color: '#1D4ED8' }}>{suggestion}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9CA3AF' }}>Click to copy</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Synonyms */}
        {synonyms && Object.keys(synonyms).length > 0 && (
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#5B21B6', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔄</span> Synonyms
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(synonyms).map(([term, syns], idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ background: '#7C3AED', color: 'white', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}>
                    {term}
                  </span>
                  <span style={{ color: '#6B7280' }}>→</span>
                  {Array.isArray(syns) && syns.map((syn, sIdx) => (
                    <span key={sIdx} style={{ background: '#EDE9FE', color: '#6D28D9', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem' }}>
                      {syn}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Terms */}
        {relatedTerms && Array.isArray(relatedTerms) && relatedTerms.length > 0 && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔗</span> Related Terms
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {relatedTerms.map((term, idx) => (
                <span key={idx} style={{ background: '#FDE68A', color: '#78350F', padding: '0.375rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                  {term}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Search Tips */}
        {searchTips && Array.isArray(searchTips) && searchTips.length > 0 && (
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#065F46', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✨</span> Search Tips
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#047857' }}>
              {searchTips.map((tip, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Effectiveness Score */}
        {item.effectiveness_score && (
          <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>Effectiveness Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: item.effectiveness_score > 0.7 ? '#10B981' : item.effectiveness_score > 0.4 ? '#F59E0B' : '#EF4444' }}>
              {Math.round((item.effectiveness_score || 0.75) * 100)}%
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
          <h1 className="page-title">🔍 AI Search Optimizer</h1>
          <p className="page-subtitle">Optimize search queries for better results</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/ai-features')}>
            ← Back to AI Features
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Optimize Search
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Search Optimizations ({optimizations.length})</h3>
        </div>
        <div className="card-body">
          {optimizations.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Original Query</th>
                    <th>Optimized Query</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {optimizations.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{item.original_query}</td>
                      <td style={{ color: '#059669' }}>{item.optimized_query || '-'}</td>
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
              <div className="empty-icon">🔍</div>
              <div className="empty-title">No search optimizations yet</div>
              <div className="empty-text">Optimize your first search query</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Optimize Search
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
              <h3 className="modal-title">Optimize Search Query</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Sample Data</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { label: 'Database setup', query: 'how to setup database' },
                    { label: 'React auth tutorial', query: 'react authentication tutorial' },
                    { label: 'Deploy to production', query: 'deploy app to production' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ original_query: sample.query })}
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
                <label className="form-label">Search Query *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.original_query}
                  onChange={(e) => setFormData({ ...formData, original_query: e.target.value })}
                  placeholder="e.g., how to configure database"
                />
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.5rem' }}>
                  Enter the search query you want to optimize
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={generating || !formData.original_query.trim()}>
                {generating ? '⏳ Optimizing...' : '✨ Optimize Query'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Search Optimization Results</h3>
              <button className="modal-close" onClick={() => setShowDetail(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {renderAIOutput(selectedItem)}
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(selectedItem.id)}>Delete</button>
              <button className="btn btn-primary" onClick={() => {
                navigate(`/search?q=${encodeURIComponent(selectedItem.optimized_query || selectedItem.original_query)}`);
              }}>
                Use Optimized Query
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AISearchOptimizer;
