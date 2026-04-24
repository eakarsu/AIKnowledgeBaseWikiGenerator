import React from 'react';

const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', variant = 'danger' }) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: { background: '#EF4444', hover: '#DC2626' },
    warning: { background: '#F59E0B', hover: '#D97706' },
    primary: { background: '#3B82F6', hover: '#2563EB' }
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title || 'Confirm Action'}</h3>
          <button className="modal-close" onClick={onCancel}>&times;</button>
        </div>
        <div className="modal-body">
          <p style={{ color: '#4B5563', fontSize: '0.875rem', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            style={{ background: style.background, color: 'white' }}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
