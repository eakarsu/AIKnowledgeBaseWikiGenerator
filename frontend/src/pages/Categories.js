import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', icon: '', color: '#3B82F6' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      addToast('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sorted = useMemo(() => {
    return [...categories].sort((a, b) => {
      let aVal = a[sortBy], bVal = b[sortBy];
      if (sortBy === 'article_count') { aVal = Number(aVal); bVal = Number(bVal); }
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = (bVal || '').toLowerCase(); }
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [categories, sortBy, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', formData);
      setShowModal(false);
      setFormData({ name: '', description: '', icon: '', color: '#3B82F6' });
      fetchCategories();
      addToast('Category created', 'success');
    } catch (error) {
      addToast('Failed to create category', 'error');
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Categories',
      message: `Delete ${selectedIds.size} selected category(ies)? Articles in these categories will be uncategorized.`,
      onConfirm: async () => {
        try {
          await api.post('/categories/bulk-delete', { ids: Array.from(selectedIds) });
          addToast(`${selectedIds.size} categories deleted`, 'success');
          setSelectedIds(new Set());
          fetchCategories();
        } catch (error) { addToast(error.response?.data?.error || 'Failed to delete', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const cols = [
    { label: 'Name', key: 'name' },
    { label: 'Description', key: 'description' },
    { label: 'Articles', key: 'article_count' },
    { label: 'Color', key: 'color' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your knowledge base content</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { exportToCSV(categories, cols, 'categories.csv'); addToast('CSV exported', 'success'); }}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Categories', categories, cols)}>PDF</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Category</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.5rem' }}>
          <select className="form-input form-select" value={`${sortBy}-${sortOrder}`}
            onChange={(e) => { const [f, o] = e.target.value.split('-'); setSortBy(f); setSortOrder(o); }}
            style={{ maxWidth: '200px' }}>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="article_count-desc">Most Articles</option>
            <option value="article_count-asc">Fewest Articles</option>
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
          {sorted.map((category) => (
            <div key={category.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.15s', border: selectedIds.has(category.id) ? '2px solid #3B82F6' : '2px solid transparent' }}
              onClick={() => navigate(`/categories/${category.id}`)}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: category.color + '20', color: category.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>📁</div>
                    <div>
                      <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{category.name}</h3>
                      <span className="badge badge-primary">{category.article_count} articles</span>
                    </div>
                  </div>
                  <input type="checkbox" checked={selectedIds.has(category.id)} onChange={(e) => toggleSelect(category.id, e)} onClick={(e) => e.stopPropagation()} />
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{category.description || 'No description'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">📁</div><div className="empty-title">No categories yet</div><div className="empty-text">Create your first category to organize articles</div><button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Category</button></div></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Category</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" /></div>
                <div className="form-group"><label className="form-label">Color</label><input type="color" className="form-input" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ height: '40px' }} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Category</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false })} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default Categories;
