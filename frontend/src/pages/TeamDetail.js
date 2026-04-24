import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonCard } from '../components/SkeletonLoader';
import api from '../services/api';

const TeamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const response = await api.get(`/teams/${id}`);
      setTeam(response.data);
    } catch (error) {
      console.error('Failed to fetch team:', error);
      addToast('Failed to load team', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Team',
      message: 'Are you sure you want to delete this team? All members will be removed from the team.',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.delete(`/teams/${id}`);
          addToast('Team deleted successfully', 'success');
          navigate('/teams');
        } catch (error) {
          console.error('Failed to delete team:', error);
          addToast(error.response?.data?.error || 'Failed to delete team', 'error');
        } finally {
          setConfirmDialog({ isOpen: false });
        }
      }
    });
  };

  const handleEdit = () => {
    setEditForm({
      name: team.name || '',
      description: team.description || ''
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editForm.name.trim()) {
      addToast('Team name is required', 'warning');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/teams/${id}`, editForm);
      setTeam(prev => ({ ...prev, ...response.data }));
      setEditing(false);
      addToast('Team updated successfully', 'success');
    } catch (error) {
      console.error('Failed to update team:', error);
      addToast(error.response?.data?.error || 'Failed to update team', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/teams')}>
              &larr; Back to Teams
            </button>
          </div>
        </div>
        <SkeletonCard count={1} />
      </div>
    );
  }

  if (!team) {
    return <div className="loading-screen">Team not found</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/teams')}>
            &larr; Back to Teams
          </button>
          <h1 className="page-title" style={{ marginTop: '1rem' }}>{team.name}</h1>
          <p className="page-subtitle">{team.description}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleEdit}>
            Edit
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete Team
          </button>
        </div>
      </div>

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Team</h3>
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
          <h3 className="card-title">Team Members ({team.members?.length || 0})</h3>
        </div>
        <div className="card-body">
          {team.members?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {team.members.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="user-avatar" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>
                            {member.name?.charAt(0).toUpperCase()}
                          </div>
                          {member.name}
                        </div>
                      </td>
                      <td>{member.email}</td>
                      <td>
                        <span className={`badge ${member.role === 'admin' ? 'badge-primary' : 'badge-gray'}`}>
                          {member.role}
                        </span>
                      </td>
                      <td>{new Date(member.joined_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <div className="empty-title">No members yet</div>
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

export default TeamDetail;
