import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonGrid } from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try { const r = await api.get('/teams'); setTeams(r.data); }
    catch { addToast('Failed to load teams', 'error'); }
    finally { setLoading(false); }
  };

  const sorted = useMemo(() => {
    return [...teams].sort((a, b) => {
      let aV = a[sortBy], bV = b[sortBy];
      if (sortBy === 'member_count') { aV = Number(aV); bV = Number(bV); }
      if (typeof aV === 'string') { aV = aV.toLowerCase(); bV = (bV || '').toLowerCase(); }
      return sortOrder === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
    });
  }, [teams, sortBy, sortOrder]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teams', formData);
      setShowModal(false); setFormData({ name: '', description: '' }); fetchTeams();
      addToast('Team created', 'success');
    } catch (error) { addToast('Failed to create team', 'error'); }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Teams',
      message: `Delete ${selectedIds.size} selected team(s)? All team members will be removed.`,
      onConfirm: async () => {
        try {
          await api.post('/teams/bulk-delete', { ids: Array.from(selectedIds) });
          addToast(`${selectedIds.size} teams deleted`, 'success');
          setSelectedIds(new Set()); fetchTeams();
        } catch (error) { addToast('Failed to delete teams', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const cols = [
    { label: 'Name', key: 'name' },
    { label: 'Description', key: 'description' },
    { label: 'Members', key: 'member_count' },
    { label: 'Created By', key: 'created_by_name' }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="page-subtitle">Collaborate with your team members</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { exportToCSV(teams, cols, 'teams.csv'); addToast('CSV exported', 'success'); }}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Teams', teams, cols)}>PDF</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Team</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.5rem' }}>
          <select className="form-input form-select" value={`${sortBy}-${sortOrder}`}
            onChange={(e) => { const [f, o] = e.target.value.split('-'); setSortBy(f); setSortOrder(o); }}
            style={{ maxWidth: '200px' }}>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="member_count-desc">Most Members</option>
            <option value="member_count-asc">Fewest Members</option>
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
          {sorted.map((team) => (
            <div key={team.id} className="card" style={{ cursor: 'pointer', border: selectedIds.has(team.id) ? '2px solid #3B82F6' : '2px solid transparent' }}
              onClick={() => navigate(`/teams/${team.id}`)}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', background: '#DBEAFE', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👥</div>
                    <div>
                      <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{team.name}</h3>
                      <span className="badge badge-primary">{team.member_count} members</span>
                    </div>
                  </div>
                  <input type="checkbox" checked={selectedIds.has(team.id)} onChange={(e) => toggleSelect(team.id, e)} onClick={(e) => e.stopPropagation()} />
                </div>
                <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{team.description || 'No description'}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">No teams yet</div><div className="empty-text">Create teams to collaborate on content</div><button className="btn btn-primary" onClick={() => setShowModal(true)}>Create Team</button></div></div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">New Team</h3><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input type="text" className="form-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" /></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Team</button></div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false })} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default Teams;
