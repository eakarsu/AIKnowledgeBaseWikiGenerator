import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try { const r = await api.get('/users'); setUsers(r.data); }
    catch { addToast('Failed to load users', 'error'); }
    finally { setLoading(false); }
  };

  const sorted = useMemo(() => {
    return [...users].sort((a, b) => {
      let aV = a[sortBy], bV = b[sortBy];
      if (typeof aV === 'string') { aV = aV.toLowerCase(); bV = (bV || '').toLowerCase(); }
      return sortOrder === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
    });
  }, [users, sortBy, sortOrder]);

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}`, { role: newRole });
      fetchUsers(); setEditingUser(null);
      addToast('Role updated', 'success');
    } catch (error) { addToast(error.response?.data?.error || 'Failed to update', 'error'); }
  };

  const handleDelete = (userId) => {
    setConfirmDialog({
      isOpen: true, title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/users/${userId}`);
          fetchUsers(); setDetailUser(null);
          addToast('User deleted', 'success');
        } catch (error) { addToast(error.response?.data?.error || 'Failed to delete', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(users.map(u => u.id)));
  };

  const handleBulkDelete = () => {
    const selfSelected = selectedIds.has(currentUser?.id);
    const toDelete = selfSelected ? new Set([...selectedIds].filter(id => id !== currentUser?.id)) : selectedIds;
    if (toDelete.size === 0) { addToast('Cannot delete your own account', 'warning'); return; }
    setConfirmDialog({
      isOpen: true, title: 'Delete Users',
      message: `Delete ${toDelete.size} selected user(s)? This cannot be undone.${selfSelected ? ' (Your own account was excluded)' : ''}`,
      onConfirm: async () => {
        try {
          await api.post('/users/bulk-delete', { ids: Array.from(toDelete) });
          addToast(`${toDelete.size} users deleted`, 'success');
          setSelectedIds(new Set()); fetchUsers();
        } catch (error) { addToast(error.response?.data?.error || 'Failed to delete', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleRowClick = async (userId) => {
    try {
      const r = await api.get(`/users/${userId}`);
      setDetailUser(r.data);
    } catch { addToast('Failed to load user details', 'error'); }
  };

  const isAdmin = currentUser?.role === 'admin';
  const cols = [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Role', key: 'role' },
    { label: 'Joined', accessor: (u) => new Date(u.created_at).toLocaleDateString() }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { exportToCSV(users, cols, 'users.csv'); addToast('CSV exported', 'success'); }}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Users', users, cols)}>PDF</button>
        </div>
      </div>

      {!isAdmin && (
        <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <strong>View Only:</strong> You need admin privileges to modify users.
        </div>
      )}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', alignItems: 'center', padding: '0.75rem 1.5rem' }}>
          <select className="form-input form-select" value={`${sortBy}-${sortOrder}`}
            onChange={(e) => { const [f, o] = e.target.value.split('-'); setSortBy(f); setSortOrder(o); }}
            style={{ maxWidth: '200px' }}>
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="role-asc">Role A-Z</option>
          </select>
          {isAdmin && selectedIds.size > 0 && (
            <>
              <span style={{ fontWeight: 500 }}>{selectedIds.size} selected</span>
              <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>Delete Selected</button>
              <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(new Set())}>Clear</button>
            </>
          )}
        </div>
      </div>

      {loading ? <SkeletonTable rows={8} cols={5} /> : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {isAdmin && <th><input type="checkbox" checked={selectedIds.size === users.length && users.length > 0} onChange={toggleSelectAll} /></th>}
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((user) => (
                    <tr key={user.id} onClick={() => handleRowClick(user.id)}>
                      {isAdmin && <td onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} /></td>}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className="user-avatar" style={{ width: '2.25rem', height: '2.25rem', fontSize: '0.875rem' }}>{user.name?.charAt(0).toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{user.name}</div>
                            {user.id === currentUser?.id && <span style={{ fontSize: '0.75rem', color: '#3B82F6' }}>(You)</span>}
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        {editingUser === user.id ? (
                          <select className="form-input form-select" defaultValue={user.role}
                            onChange={(e) => handleUpdateRole(user.id, e.target.value)} onBlur={() => setEditingUser(null)} autoFocus
                            style={{ width: 'auto', padding: '0.25rem 0.5rem' }} onClick={(e) => e.stopPropagation()}>
                            <option value="user">User</option><option value="editor">Editor</option><option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span className={`badge ${user.role === 'admin' ? 'badge-primary' : user.role === 'editor' ? 'badge-success' : 'badge-gray'}`}
                            style={{ cursor: isAdmin ? 'pointer' : 'default' }}
                            onClick={(e) => { e.stopPropagation(); isAdmin && setEditingUser(user.id); }}>
                            {user.role}
                          </span>
                        )}
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      {isAdmin && (
                        <td onClick={(e) => e.stopPropagation()}>
                          {user.id !== currentUser?.id && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>Delete</button>}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* User Stats */}
      <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#DBEAFE', color: '#3B82F6' }}>👤</div><div className="stat-value">{users.filter(u => u.role === 'user').length}</div><div className="stat-label">Regular Users</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#D1FAE5', color: '#10B981' }}>✏️</div><div className="stat-value">{users.filter(u => u.role === 'editor').length}</div><div className="stat-label">Editors</div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#EDE9FE', color: '#8B5CF6' }}>👑</div><div className="stat-value">{users.filter(u => u.role === 'admin').length}</div><div className="stat-label">Administrators</div></div>
      </div>

      {/* User Detail Modal */}
      {detailUser && (
        <div className="modal-overlay" onClick={() => setDetailUser(null)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">User Details</h3><button className="modal-close" onClick={() => setDetailUser(null)}>&times;</button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="user-avatar" style={{ width: '4rem', height: '4rem', fontSize: '1.5rem' }}>{detailUser.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>{detailUser.name}</h3>
                  <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>{detailUser.email}</p>
                  <span className={`badge ${detailUser.role === 'admin' ? 'badge-primary' : detailUser.role === 'editor' ? 'badge-success' : 'badge-gray'}`}>{detailUser.role}</span>
                </div>
              </div>
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}><span style={{ color: '#6B7280' }}>Articles</span><span style={{ fontWeight: 500 }}>{detailUser.articles_count || 0}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}><span style={{ color: '#6B7280' }}>Teams</span><span style={{ fontWeight: 500 }}>{detailUser.teams?.length || 0}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}><span style={{ color: '#6B7280' }}>Joined</span><span style={{ fontWeight: 500 }}>{new Date(detailUser.created_at).toLocaleDateString()}</span></div>
              </div>
              {detailUser.teams?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Teams</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {detailUser.teams.map(t => <span key={t.id} className="badge badge-primary">{t.name} ({t.role})</span>)}
                  </div>
                </div>
              )}
            </div>
            {isAdmin && detailUser.id !== currentUser?.id && (
              <div className="modal-footer">
                <button className="btn btn-danger btn-sm" onClick={() => { setDetailUser(null); handleDelete(detailUser.id); }}>Delete User</button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false })} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default Users;
