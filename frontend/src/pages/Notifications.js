import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonCard } from '../components/SkeletonLoader';
import api from '../services/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const { addToast } = useToast();

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try { const r = await api.get('/notifications'); setNotifications(r.data); }
    catch { addToast('Failed to load notifications', 'error'); }
    finally { setLoading(false); }
  };

  const handleMarkAsRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); fetchNotifications(); addToast('Marked as read', 'success'); }
    catch { addToast('Failed to mark as read', 'error'); }
  };

  const handleMarkAllAsRead = async () => {
    try { await api.put('/notifications/read-all'); fetchNotifications(); addToast('All marked as read', 'success'); }
    catch { addToast('Failed to mark all as read', 'error'); }
  };

  const handleDelete = async (id) => {
    try { await api.delete(`/notifications/${id}`); fetchNotifications(); addToast('Notification deleted', 'success'); }
    catch { addToast('Failed to delete notification', 'error'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(notifications.map(n => n.id)));
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Notifications',
      message: `Delete ${selectedIds.size} selected notification(s)?`,
      onConfirm: async () => {
        try {
          await api.post('/notifications/bulk-delete', { ids: Array.from(selectedIds) });
          addToast(`${selectedIds.size} notifications deleted`, 'success');
          setSelectedIds(new Set()); fetchNotifications();
        } catch { addToast('Failed to delete notifications', 'error'); }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const getIcon = (type) => {
    switch (type) { case 'comment': return '💬'; case 'mention': return '📢'; case 'update': return '📝'; case 'team_invite': return '👥'; default: return '🔔'; }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread notifications</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unreadCount > 0 && <button className="btn btn-secondary" onClick={handleMarkAllAsRead}>Mark All as Read</button>}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem' }}>
            <span style={{ fontWeight: 500 }}>{selectedIds.size} selected</span>
            <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>Delete Selected</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {loading ? <SkeletonCard count={5} /> : notifications.length > 0 ? (
        <>
          <div style={{ marginBottom: '0.5rem', padding: '0 0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B7280', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedIds.size === notifications.length && notifications.length > 0} onChange={toggleSelectAll} />
              Select All
            </label>
          </div>
          <div className="card">
            <div className="card-body" style={{ padding: 0 }}>
              {notifications.map((notification) => (
                <div key={notification.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.5rem', borderBottom: '1px solid #E5E7EB', background: notification.read ? 'transparent' : '#EFF6FF' }}>
                  <input type="checkbox" checked={selectedIds.has(notification.id)} onChange={() => toggleSelect(notification.id)} style={{ marginTop: '0.5rem' }} />
                  <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: notification.read ? '#F3F4F6' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                    {getIcon(notification.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{notification.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.5rem' }}>{notification.message}</p>
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{new Date(notification.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!notification.read && <button className="btn btn-sm btn-secondary" onClick={() => handleMarkAsRead(notification.id)}>Mark Read</button>}
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(notification.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">🔔</div><div className="empty-title">No notifications</div><div className="empty-text">You're all caught up!</div></div></div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false })} confirmText="Delete" variant="danger" />
    </div>
  );
};

export default Notifications;
