import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const AIApiDocumentation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [docs, setDocs] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    endpoint: '',
    method: 'GET',
    description: '',
    category: 'General',
    version: 'v1'
  });

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    if (id) {
      fetchDocDetail(id);
    }
  }, [id]);

  const fetchDocs = async () => {
    try {
      const response = await api.get('/ai/api-docs');
      setDocs(response.data);
    } catch (error) {
      console.error('Failed to fetch docs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocDetail = async (docId) => {
    try {
      const response = await api.get(`/ai/api-docs/${docId}`);
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to fetch doc detail:', error);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    setGenerating(true);
    try {
      const response = await api.post('/ai/api-docs', formData);
      setDocs([response.data, ...docs]);
      setShowForm(false);
      setFormData({ name: '', endpoint: '', method: 'GET', description: '', category: 'General', version: 'v1' });
      setSelectedItem(response.data);
      setShowDetail(true);
    } catch (error) {
      console.error('Failed to create doc:', error);
      alert('Failed to generate API documentation. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      const response = await api.put(`/ai/api-docs/${selectedItem.id}`, selectedItem);
      setDocs(docs.map(d => d.id === response.data.id ? response.data : d));
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update doc:', error);
      alert('Failed to update documentation');
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this documentation?')) return;
    try {
      await api.delete(`/ai/api-docs/${docId}`);
      setDocs(docs.filter(d => d.id !== docId));
      if (selectedItem?.id === docId) {
        setShowDetail(false);
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete doc:', error);
      alert('Failed to delete documentation');
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
    const parameters = parseJSON(item.parameters);
    const headers = parseJSON(item.headers);
    const requestBody = parseJSON(item.request_body);
    const responseBody = parseJSON(item.response_body);
    const examples = parseJSON(item.examples);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Endpoint Header */}
        <div style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              fontSize: '0.875rem'
            }}>
              {item.method || 'GET'}
            </span>
            <code style={{ fontSize: '1.125rem', fontFamily: 'monospace' }}>{item.endpoint || '/api/endpoint'}</code>
          </div>
          <div style={{ opacity: 0.9 }}>{item.description || 'No description'}</div>
        </div>

        {/* Parameters */}
        {parameters && Array.isArray(parameters) && parameters.length > 0 && (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#166534', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📌</span> Parameters
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ background: '#DCFCE7' }}>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #BBF7D0' }}>Name</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #BBF7D0' }}>Type</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #BBF7D0' }}>Required</th>
                    <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '1px solid #BBF7D0' }}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {parameters.map((param, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #D1FAE5' }}>
                        <code style={{ background: '#ECFDF5', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>{param.name}</code>
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #D1FAE5', color: '#059669' }}>{param.type}</td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #D1FAE5' }}>
                        {param.required ? <span style={{ color: '#DC2626' }}>Yes</span> : <span style={{ color: '#6B7280' }}>No</span>}
                      </td>
                      <td style={{ padding: '0.5rem', borderBottom: '1px solid #D1FAE5', color: '#374151' }}>{param.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Headers */}
        {headers && Array.isArray(headers) && headers.length > 0 && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#1E40AF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📋</span> Headers
            </div>
            {headers.map((header, idx) => (
              <div key={idx} style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <code style={{ background: '#DBEAFE', padding: '0.125rem 0.5rem', borderRadius: '0.25rem', color: '#1D4ED8' }}>{header.name}</code>
                {header.required && <span style={{ color: '#DC2626', fontSize: '0.75rem' }}>*</span>}
                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>{header.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* Request Body */}
        {requestBody && (
          <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#92400E', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📤</span> Request Body
            </div>
            <pre style={{
              background: '#1F2937',
              color: '#10B981',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.8125rem',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(requestBody, null, 2)}
            </pre>
          </div>
        )}

        {/* Response Body */}
        {responseBody && (
          <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#5B21B6', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>📥</span> Response Body
            </div>
            <pre style={{
              background: '#1F2937',
              color: '#A78BFA',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.8125rem',
              fontFamily: 'monospace'
            }}>
              {JSON.stringify(responseBody, null, 2)}
            </pre>
          </div>
        )}

        {/* Examples */}
        {examples && Array.isArray(examples) && examples.length > 0 && (
          <div style={{ background: '#FDF2F8', border: '1px solid #FBCFE8', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#9D174D', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>💻</span> Code Examples
            </div>
            {examples.map((example, idx) => (
              <div key={idx} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#DB2777', marginBottom: '0.5rem', fontWeight: 500 }}>
                  {example.language}
                </div>
                <pre style={{
                  background: '#1F2937',
                  color: '#F9FAFB',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.8125rem',
                  fontFamily: 'monospace'
                }}>
                  {example.code}
                </pre>
              </div>
            ))}
          </div>
        )}

        {/* Authentication */}
        {item.authentication && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1rem', borderRadius: '0.75rem' }}>
            <div style={{ fontWeight: 600, color: '#991B1B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🔐</span> Authentication
            </div>
            <p style={{ color: '#7F1D1D', margin: 0 }}>{item.authentication}</p>
          </div>
        )}

        {/* Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Category</div>
            <div style={{ fontWeight: 500, color: '#374151' }}>{item.category || 'General'}</div>
          </div>
          <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Version</div>
            <div style={{ fontWeight: 500, color: '#374151' }}>{item.version || 'v1'}</div>
          </div>
          <div style={{ background: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>Status</div>
            <div style={{ fontWeight: 500, color: item.status === 'active' ? '#059669' : '#6B7280' }}>{item.status || 'active'}</div>
          </div>
        </div>
      </div>
    );
  };

  const methodColors = {
    GET: '#10B981',
    POST: '#3B82F6',
    PUT: '#F59E0B',
    PATCH: '#8B5CF6',
    DELETE: '#EF4444'
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📋 AI API Documentation</h1>
          <p className="page-subtitle">Generate comprehensive API documentation for DevOps</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/ai-features')}>
            ← Back to AI Features
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + New Documentation
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">API Documentation ({docs.length})</h3>
        </div>
        <div className="card-body">
          {docs.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Method</th>
                    <th>Endpoint</th>
                    <th>Category</th>
                    <th>Version</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => { setSelectedItem(item); setShowDetail(true); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td>
                        <span style={{
                          background: `${methodColors[item.method] || '#6B7280'}20`,
                          color: methodColors[item.method] || '#6B7280',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          {item.method || 'GET'}
                        </span>
                      </td>
                      <td><code style={{ fontSize: '0.875rem' }}>{item.endpoint || '-'}</code></td>
                      <td>{item.category || 'General'}</td>
                      <td>{item.version || 'v1'}</td>
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
              <div className="empty-icon">📋</div>
              <div className="empty-title">No API documentation yet</div>
              <div className="empty-text">Generate your first AI-powered API documentation</div>
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                + Create Documentation
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
              <h3 className="modal-title">Generate API Documentation</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Sample Data</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[
                    { label: 'User Authentication', name: 'User Authentication', endpoint: '/api/v1/auth/login', method: 'POST', description: 'Authenticate a user with email and password, returning a JWT token for subsequent API requests', category: 'Authentication', version: 'v1' },
                    { label: 'List Articles', name: 'List Articles', endpoint: '/api/v1/articles', method: 'GET', description: 'Retrieve a paginated list of published knowledge base articles with optional filtering and sorting', category: 'Content', version: 'v1' },
                    { label: 'Create Team', name: 'Create Team', endpoint: '/api/v1/teams', method: 'POST', description: 'Create a new team with specified members and permissions for collaborative content management', category: 'Users', version: 'v1' }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ name: sample.name, endpoint: sample.endpoint, method: sample.method, description: sample.description, category: sample.category, version: sample.version })}
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
                <label className="form-label">API Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., User Authentication API"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Method</label>
                  <select
                    className="form-input"
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  >
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                    <option>PATCH</option>
                    <option>DELETE</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Endpoint</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.endpoint}
                    onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                    placeholder="/api/v1/users"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this API endpoint does..."
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option>General</option>
                    <option>Authentication</option>
                    <option>Users</option>
                    <option>Content</option>
                    <option>Analytics</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Version</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="v1"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={generating || !formData.name.trim()}>
                {generating ? '⏳ Generating...' : '✨ Generate Documentation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => { setShowDetail(false); setEditMode(false); }}>
          <div className="modal" style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editMode ? 'Edit Documentation' : selectedItem.name}
              </h3>
              <button className="modal-close" onClick={() => { setShowDetail(false); setEditMode(false); }}>&times;</button>
            </div>
            <div className="modal-body">
              {editMode ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedItem.name || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Method</label>
                      <select
                        className="form-input"
                        value={selectedItem.method || 'GET'}
                        onChange={(e) => setSelectedItem({ ...selectedItem, method: e.target.value })}
                      >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>PATCH</option>
                        <option>DELETE</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Endpoint</label>
                      <input
                        type="text"
                        className="form-input"
                        value={selectedItem.endpoint || ''}
                        onChange={(e) => setSelectedItem({ ...selectedItem, endpoint: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input"
                      rows="3"
                      value={selectedItem.description || ''}
                      onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                    />
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
                  <button className="btn btn-primary" onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedItem, null, 2))}>
                    Copy JSON
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

export default AIApiDocumentation;
