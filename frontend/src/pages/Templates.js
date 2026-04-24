import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', content: '', category: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchTemplates(); }, []);

  const fetchTemplates = async () => {
    try { const r = await api.get('/templates'); setTemplates(r.data); }
    catch { addToast('Failed to load templates', 'error'); }
    finally { setLoading(false); }
  };

  const sorted = useMemo(() => {
    return [...templates].sort((a, b) => {
      const aV = (a[sortBy] || '').toString().toLowerCase();
      const bV = (b[sortBy] || '').toString().toLowerCase();
      return sortOrder === 'asc' ? aV.localeCompare(bV) : bV.localeCompare(aV);
    });
  }, [templates, sortBy, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/templates', formData);
      setShowModal(false); setFormData({ name: '', description: '', content: '', category: '' }); fetchTemplates();
      addToast('Template created', 'success');
    } catch (error) { addToast('Failed to create template', 'error'); }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Templates',
      message: `Delete ${selectedIds.size} selected template(s)? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.post('/templates/bulk-delete', { ids: Array.from(selectedIds) });
          addToast(`${selectedIds.size} templates deleted`, 'success');
          setSelectedIds(new Set()); fetchTemplates();
        } catch (error) { addToast(error.response?.data?.error || 'Failed to delete', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const cols = [
    { label: 'Name', key: 'name' },
    { label: 'Category', key: 'category' },
    { label: 'Description', key: 'description' },
    { label: 'Created By', key: 'created_by_name' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">Reusable content templates for quick article creation</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { exportToCSV(templates, cols, 'templates.csv'); addToast('CSV exported', 'success'); }}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Templates', templates, cols)}>PDF</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Template</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.5rem' }}>
          <select className="form-input form-select" value={`${sortBy}-${sortOrder}`}
            onChange={(e) => { const [f, o] = e.target.value.split('-'); setSortBy(f); setSortOrder(o); }}
            style={{ maxWidth: '200px' }}>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="category-asc">Category A-Z</option>
          </select>
          {selectedIds.size > 0 && (
            <>
              <span style={{ fontWeight: 500 }}>{selectedIds.size} selected</span>
              <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>Delete Selected</button>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(new Set())}>Clear</button>
            </>
          )}
        </div>
      </div>

      {loading ? <SkeletonGrid count={6} cols={3} /> : sorted.length > 0 ? (
        <div className="grid grid-3">
          {sorted.map((template) => (
            <div key={template.id} className="card" style={{ cursor: 'pointer', border: selectedIds.has(template.id) ? '2px solid #3B82F6' : '2px solid transparent' }}
              onClick={() => navigate(`/templates/${template.id}`)}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontWeight: 600 }}>{template.name}</h3>
                  <input type="checkbox" checked={selectedIds.has(template.id)} onChange={(e) => toggleSelect(template.id, e)} onClick={(e) => e.stopPropagation()} />
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.75rem' }}>{template.description || 'No description'}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {template.category && <span className="badge badge-primary">{template.category}</span>}
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>by {template.created_by_name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">📝</div><div className="empty-title">No templates yet</div><div className="empty-text">Create templates to speed up content creation</div><button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Template</button></div></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Template</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Category</label><input type="text" className="form-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g., tutorial, api, support" /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="2" /></div>
                <div className="form-group"><label className="form-label">Content (Markdown)</label><textarea className="form-input form-textarea" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} rows="10" placeholder="# Template Title&#10;&#10;Content goes here..." /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Template</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false })} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default Templates;
