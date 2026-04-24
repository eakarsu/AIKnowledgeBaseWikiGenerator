import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AIOutdatedContent = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [articles, setArticles] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [formData, setFormData] = useState({
    article_id: '',
    content: '',
    title: '',
    last_updated: ''
  });

  useEffect(() => {
    fetchItems();
    fetchArticles();
  }, []);

  useEffect(() => {
    if (id) {
      fetchItemDetail(id);
    }
  }, [id]);

  const fetchItems = async () => {
    try {
      const response = await api.get('/ai/outdated-content');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await api.get('/articles');
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const fetchItemDetail = async (itemId) => {
    try {
      const response = await api.get(`/ai/outdated-content/${itemId}`);
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to fetch item detail:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.content.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/ai/outdated-content', formData);
      setItems([response.data, ...items]);
      setShowForm(false);
      setFormData({ article_id: '', content: '', title: '', last_updated: '' });
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to check content:', error);
      alert('Failed to analyze content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async (itemId, status) => {
    try {
      const response = await api.put(`/ai/outdated-content/${itemId}`, {
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      });
      setItems(items.map(i => i.id === response.data.id ? response.data : i));
      if (selectedItem?.id === itemId) {
        setSelectedItem(response.data);
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/ai/outdated-content/${itemId}`);
      setItems(items.filter(i => i.id !== itemId));
      if (selectedItem?.id === itemId) {
        setShowDetail(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete record');
    }
  };

  const handleArticleSelect = (articleId) => {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      setFormData({
        ...formData,
        article_id: articleId,
        title: article.title,
        content: article.content,
        last_updated: article.updated_at
      });
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

  const severityColors = {
    low: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' },
    medium: { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' },
    high: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B' },
    critical: { bg: '#FDF2F8', border: '#FBCFE8', text: '#9D174D' }
  };

  const renderAIOutput = (item) => {
    const detectedIssues = parseJSON(item.detected_issues);
    const recommendations = parseJSON(item.recommendations);
    const colors = severityColors[item.severity] || severityColors.low;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Severity Banner */}
        <div style={{
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          padding: '1.5rem',
          borderRadius: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: colors.border,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem'
          }}>
            {item.severity === 'critical' ? '🚨' : item.severity === 'high' ? '⚠️' : item.severity === 'medium' ? '⏰' : '📝'}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: colors.text, fontWeight: 600 }}>
              Severity Level
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: colors.text, textTransform: 'capitalize' }}>
              {item.severity || 'Low'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Status</div>
            <span className={`badge ${item.status === 'resolved' ? 'badge-success' : item.status === 'in_progress' ? 'badge-warning' : 'badge-danger'}`}>
              {item.status || 'detected'}
            </span>
          </div>
        </div>

        {/* Article Info */}
        <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.75rem' }}>
          <div style={{ fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            {item.article_title || 'Untitled Article'}
          </div>
          <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>
            Last Updated: {item.last_updated ? new Date(item.last_updated).toLocaleDateString() : 'Unknown'}
          </div>
          {item.content_snippet && (
            <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#4B5563' }}>
              {item.content_snippet}...
            </div>
          )}
        </div>

        {/* Detected Issues */}
        {detectedIssues && Array.isArray(detectedIssues) && detectedIssues.length > 0 && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#991B1B', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔍</span> Detected Issues ({detectedIssues.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {detectedIssues.map((issue, idx) => (
                <div key={idx} style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #FEE2E2' }}>
                  <div style={{ fontWeight: 500, color: '#991B1B', marginBottom: '0.25rem' }}>
                    {issue.issue || issue}
                  </div>
                  {issue.location && (
                    <div style={{ fontSize: '0.75rem', color: '#DC2626', marginBottom: '0.25rem' }}>
                      📍 {issue.location}
                    </div>
                  )}
                  {issue.reason && (
                    <div style={{ fontSize: '0.875rem', color: '#7F1D1D' }}>
                      {issue.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reason/Summary */}
        {item.reason && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Summary
            </div>
            <p style={{ color: '#78350F', margin: 0, lineHeight: 1.6 }}>{item.reason}</p>
          </div>
        )}

        {/* Recommendations */}
        {recommendations && Array.isArray(recommendations) && recommendations.length > 0 && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span> Recommendations
            </div>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#15803D' }}>
              {recommendations.map((rec, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', lineHeight: 1.5 }}>{rec}</li>
              ))}
            </ol>
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
          <h1 className="page-title">⏰ AI Outdated Content Detector</h1>
          <p className="page-subtitle">Detect and flag content that needs updating</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/ai-features')}>
            ← Back to AI Features
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Check Content
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {['detected', 'in_progress', 'resolved', 'critical'].map((status) => {
          const count = items.filter(i => status === 'critical' ? i.severity === 'critical' : i.status === status).length;
          const colors = status === 'detected' ? '#EF4444' : status === 'in_progress' ? '#F59E0B' : status === 'resolved' ? '#10B981' : '#DB2777';
          return (
            <div key={status} style={{ background: 'white', padding: '1rem', borderRadius: '0.75rem', borderLeft: `4px solid ${colors}` }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: colors }}>{count}</div>
              <div style={{ fontSize: '0.875rem', color: '#6B7280', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Outdated Content Reports ({items.length})</h3>
        </div>
        <div className="card-body">
          {items.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Detected</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{item.article_title || 'Untitled'}</td>
                      <td>
                        <span className={`badge ${item.severity === 'critical' ? 'badge-danger' : item.severity === 'high' ? 'badge-warning' : item.severity === 'medium' ? 'badge-primary' : 'badge-gray'}`}>
                          {item.severity || 'low'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${item.status === 'resolved' ? 'badge-success' : item.status === 'in_progress' ? 'badge-warning' : 'badge-danger'}`}>
                          {item.status || 'detected'}
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
              <div className="empty-icon">⏰</div>
              <div className="empty-title">No outdated content detected</div>
              <div className="empty-text">Check your articles for outdated information</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Check Content
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
              <h3 className="modal-title">Check Content for Outdated Information</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Sample Data</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { label: 'Outdated Node.js Tutorial', title: 'Getting Started with Node.js', content: 'This tutorial covers setting up Node.js 12 LTS for your development environment. First, download Node.js 12 from the official website. Node 12 introduced the --experimental-modules flag for ES modules support. Use npm 6 to install packages. For process management, we recommend using pm2 with the ecosystem.config.js file. The V8 engine in Node 12 supports most ES2019 features. Remember to set your Dockerfile base image to node:12-alpine for production deployments.', last_updated: '2021-03-15' },
                    { label: 'React Class Components', title: 'Building React Applications with Class Components', content: 'React class components are the primary way to build interactive UIs. Start by extending React.Component and implementing the render() method. Use this.setState() to update component state, and lifecycle methods like componentDidMount() and componentWillReceiveProps() to handle side effects. For state management across components, use Redux with connect() HOC from react-redux. Create container components and presentational components for clean separation of concerns. Avoid using React hooks as they are still experimental.', last_updated: '2020-08-20' },
                    { label: 'Docker Compose v2 Migration', title: 'Docker Compose Configuration Guide', content: 'Use docker-compose (with hyphen) CLI to manage multi-container applications. Your docker-compose.yml should use version: "2.4" for the best compatibility. Link containers using the links directive and depends_on for startup ordering. Use docker-compose up -d to start services in detached mode. For networking, rely on the default bridge network created by docker-compose. Volume mounting syntax follows the host:container format. Remember that docker-compose down removes containers but preserves volumes by default.', last_updated: '2021-06-10' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ article_id: '', title: sample.title, content: sample.content, last_updated: sample.last_updated })}
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
                <label className="form-label">Select Article (Optional)</label>
                <select
                  className="form-input"
                  value={formData.article_id}
                  onChange={(e) => handleArticleSelect(e.target.value)}
                >
                  <option value="">-- Select an article --</option>
                  {articles.map(article => (
                    <option key={article.id} value={article.id}>{article.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Article title"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea
                  className="form-input"
                  rows="6"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Paste the content you want to check for outdated information..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Updated</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.last_updated ? formData.last_updated.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, last_updated: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={generating || !formData.content.trim()}>
                {generating ? '⏳ Analyzing...' : '✨ Check Content'}
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
              <h3 className="modal-title">Outdated Content Report</h3>
              <button className="modal-close" onClick={() => setShowDetail(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {renderAIOutput(selectedItem)}
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={() => handleDelete(selectedItem.id)}>Delete</button>
              {selectedItem.status !== 'resolved' && (
                <>
                  {selectedItem.status !== 'in_progress' && (
                    <button className="btn btn-warning" onClick={() => handleUpdate(selectedItem.id, 'in_progress')}>
                      Mark In Progress
                    </button>
                  )}
                  <button className="btn btn-success" onClick={() => handleUpdate(selectedItem.id, 'resolved')}>
                    Mark Resolved
                  </button>
                </>
              )}
              {selectedItem.article_id && (
                <button className="btn btn-primary" onClick={() => navigate(`/articles/${selectedItem.article_id}/edit`)}>
                  Edit Article
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIOutdatedContent;
