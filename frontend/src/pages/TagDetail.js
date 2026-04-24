import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonCard } from '../components/SkeletonLoader';
import api from '../services/api';

const TagDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [tag, setTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', color: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTag();
  }, [id]);

  const fetchTag = async () => {
    try {
      const response = await api.get(`/tags/${id}`);
      setTag(response.data);
    } catch (error) {
      console.error('Failed to fetch tag:', error);
      addToast('Failed to load tag', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Tag',
      message: 'Are you sure you want to delete this tag? It will be removed from all associated articles.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/tags/${id}`);
          addToast('Tag deleted successfully', 'success');
          navigate('/tags');
        } catch (error) {
          console.error('Failed to delete tag:', error);
          addToast(error.response?.data?.error || 'Failed to delete tag', 'error');
        } finally {
          setConfirmDialog({ isOpen: false });
        }
      }
    });
  };

  const handleEdit = () => {
    setEditForm({
      name: tag.name || '',
      color: tag.color || '#3B82F6'
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      addToast('Tag name is required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/tags/${id}`, editForm);
      setTag(prev => ({ ...prev, ...response.data }));
      setEditing(false);
      addToast('Tag updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update tag:', error);
      addToast(error.response?.data?.error || 'Failed to update tag', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tags')}>
              &larr; Back to Tags
            </button>
          </div>
        </div>
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (!tag) {
    return <div className="loading-screen">Tag not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tags')}>
            &larr; Back to Tags
          </button>
          <h1 className="page-title" style={{ marginTop: '1rem', color: tag.color }}>
            #{tag.name}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Tag</h3>
              <button className="modal-close" onClick={() => setEditing(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={editForm.name}
                  onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="color"
                    value={editForm.color}
                    onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                    style={{ width: '3rem', height: '2.5rem', border: 'none', cursor: 'pointer' }}
                  />
                  <input
                    className="form-input"
                    value={editForm.color}
                    onChange={e => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Articles with this tag ({tag.articles?.length || 0})</h3>
        </div>
        <div className="card-body">
          {tag.articles?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {tag.articles.map((article) => (
                    <tr key={article.id} onClick={() => navigate(`/articles/${article.id}`)}>
                      <td>{article.title}</td>
                      <td>
                        <span className={`badge ${article.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                          {article.status}
                        </span>
                      </td>
                      <td>{article.views}</td>
                      <td>{new Date(article.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <div className="empty-title">No articles with this tag</div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
};

export default TagDetail;
