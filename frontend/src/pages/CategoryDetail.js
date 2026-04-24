import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonCard } from '../components/SkeletonLoader';
import api from '../services/api';

const CategoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', color: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const fetchCategory = async () => {
    try {
      const response = await api.get(`/categories/${id}`);
      setCategory(response.data);
    } catch (error) {
      console.error('Failed to fetch category:', error);
      addToast('Failed to load category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? Articles in this category will be uncategorized.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/categories/${id}`);
          addToast('Category deleted successfully', 'success');
          navigate('/categories');
        } catch (error) {
          console.error('Failed to delete category:', error);
          addToast(error.response?.data?.error || 'Failed to delete category', 'error');
        } finally {
          setConfirmDialog({ isOpen: false });
        }
      }
    });
  };

  const handleEdit = () => {
    setEditForm({
      name: category.name || '',
      description: category.description || '',
      color: category.color || '#3B82F6'
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      addToast('Category name is required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/categories/${id}`, editForm);
      setCategory(prev => ({ ...prev, ...response.data }));
      setEditing(false);
      addToast('Category updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update category:', error);
      addToast(error.response?.data?.error || 'Failed to update category', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/categories')}>
              &larr; Back to Categories
            </button>
          </div>
        </div>
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (!category) {
    return <div className="loading-screen">Category not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/categories')}>
            &larr; Back to Categories
          </button>
          <h1 className="page-title" style={{ marginTop: '1rem' }}>{category.name}</h1>
          <p className="page-subtitle">{category.description || 'No description'}</p>
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
              <h3 className="modal-title">Edit Category</h3>
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
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
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
          <h3 className="card-title">Articles in this Category ({category.articles?.length || 0})</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/articles/new')}>
            + New Article
          </button>
        </div>
        <div className="card-body">
          {category.articles?.length > 0 ? (
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
                  {category.articles.map((article) => (
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
              <div className="empty-title">No articles in this category</div>
              <button className="btn btn-primary" onClick={() => navigate('/articles/new')}>
                Create Article
              </button>
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

export default CategoryDetail;
