import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';

const Tags = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', color: '#6366f1' });
  const [sortBy, setSortBy] = useState('article_count');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchTags(); }, []);

  const fetchTags = async () => {
    try { const r = await api.get('/tags'); setTags(r.data); }
    catch { addToast('Failed to load tags', 'error'); }
    finally { setLoading(false); }
  };

  const sorted = useMemo(() => {
    return [...tags].sort((a, b) => {
      let aV = a[sortBy], bV = b[sortBy];
      if (sortBy === 'article_count') { aV = Number(aV); bV = Number(bV); }
      if (typeof aV === 'string') { aV = aV.toLowerCase(); bV = (bV || '').toLowerCase(); }
      return sortOrder === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
    });
  }, [tags, sortBy, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tags', formData);
      setShowModal(false); setFormData({ name: '', color: '#6366f1' }); fetchTags();
      addToast('Tag created', 'success');
    } catch (error) { addToast(error.response?.data?.error || 'Failed to create tag', 'error'); }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Tags',
      message: `Delete ${selectedIds.size} selected tag(s)? They will be removed from all articles.`,
      onConfirm: async () => {
        try {
          await api.post('/tags/bulk-delete', { ids: Array.from(selectedIds) });
          addToast(`${selectedIds.size} tags deleted`, 'success');
          setSelectedIds(new Set()); fetchTags();
        } catch (error) { addToast(error.response?.data?.error || 'Failed to delete', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const cols = [
    { label: 'Name', key: 'name' },
    { label: 'Articles', key: 'article_count' },
    { label: 'Color', key: 'color' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tags</h1>
          <p className="page-subtitle">Label and organize your content</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { exportToCSV(tags, cols, 'tags.csv'); addToast('CSV exported', 'success'); }}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Tags', tags, cols)}>PDF</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Tag</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.5rem' }}>
          <select className="form-input form-select" value={`${sortBy}-${sortOrder}`}
            onChange={(e) => { const [f, o] = e.target.value.split('-'); setSortBy(f); setSortOrder(o); }}
            style={{ maxWidth: '200px' }}>
            <option value="article_count-desc">Most Articles</option>
            <option value="article_count-asc">Fewest Articles</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
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

      {loading ? <SkeletonGrid count={8} cols={4} /> : sorted.length > 0 ? (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {sorted.map((tag) => (
                <div key={tag.id} onClick={() => navigate(`/tags/${tag.id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '0.5rem',
                    background: selectedIds.has(tag.id) ? '#DBEAFE' : tag.color + '15', border: `2px solid ${selectedIds.has(tag.id) ? '#3B82F6' : tag.color}`,
                    cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="checkbox" checked={selectedIds.has(tag.id)} onChange={(e) => toggleSelect(tag.id, e)} onClick={(e) => e.stopPropagation()} />
                  <span style={{ color: tag.color, fontWeight: 500 }}>#{tag.name}</span>
                  <span className="badge badge-gray">{tag.article_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">🏷️</div><div className="empty-title">No tags yet</div><div className="empty-text">Create tags to organize your articles</div><button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Tag</button></div></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Tag</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., javascript, tutorial" required /></div>
                <div className="form-group"><label className="form-label">Color</label><input type="color" className="form-input" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} style={{ height: '40px' }} /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Tag</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false })} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default Tags;
