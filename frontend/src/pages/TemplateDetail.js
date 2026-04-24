import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonCard } from '../components/SkeletonLoader';
import api from '../services/api';

const TemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', category: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTemplate();
  }, [id]);

  const fetchTemplate = async () => {
    try {
      const response = await api.get(`/templates/${id}`);
      setTemplate(response.data);
    } catch (error) {
      console.error('Failed to fetch template:', error);
      addToast('Failed to load template', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Template',
      message: 'Are you sure you want to delete this template? This action cannot be undone.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/templates/${id}`);
          addToast('Template deleted successfully', 'success');
          navigate('/templates');
        } catch (error) {
          console.error('Failed to delete template:', error);
          addToast(error.response?.data?.error || 'Failed to delete template', 'error');
        } finally {
          setConfirmDialog({ isOpen: false });
        }
      }
    });
  };

  const handleEdit = () => {
    setEditForm({
      name: template.name || '',
      description: template.description || '',
      category: template.category || '',
      content: template.content || ''
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      addToast('Template name is required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/templates/${id}`, editForm);
      setTemplate(prev => ({ ...prev, ...response.data }));
      setEditing(false);
      addToast('Template updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update template:', error);
      addToast(error.response?.data?.error || 'Failed to update template', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUseTemplate = () => {
    navigate('/articles/new', { state: { template: template.content } });
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/templates')}>
              &larr; Back to Templates
            </button>
          </div>
        </div>
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (!template) {
    return <div className="loading-screen">Template not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/templates')}>
            &larr; Back to Templates
          </button>
          <h1 className="page-title" style={{ marginTop: '1rem' }}>{template.name}</h1>
          <p className="page-subtitle">{template.description}</p>
          {template.category && (
            <span className="badge badge-primary" style={{ marginTop: '0.5rem' }}>
              {template.category}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleUseTemplate}>
            Use Template
          </button>
          <button className="btn btn-secondary" onClick={handleEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Template</h3>
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
                  rows={2}
                  value={editForm.description}
                  onChange={e => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  className="form-input"
                  value={editForm.category}
                  onChange={e => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Content (Markdown)</label>
                <textarea
                  className="form-input"
                  rows={10}
                  value={editForm.content}
                  onChange={e => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
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
          <h3 className="card-title">Template Preview</h3>
        </div>
        <div className="card-body article-body">
          <ReactMarkdown>{template.content || 'No content'}</ReactMarkdown>
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

export default TemplateDetail;
