import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const typeStyles = {
    success: { background: '#059669', icon: '\u2713' },
    error: { background: '#DC2626', icon: '\u2717' },
    warning: { background: '#D97706', icon: '\u26A0' },
    info: { background: '#2563EB', icon: '\u2139' }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          const style = typeStyles[toast.type] || typeStyles.info;
          return (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              style={{
                background: style.background,
                color: 'white',
                padding: '0.75rem 1.25rem',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 500,
                minWidth: '280px',
                maxWidth: '420px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>{style.icon}</span>
              <span style={{ flex: 1 }}>{toast.message}</span>
              <span style={{ opacity: 0.7, fontSize: '1.25rem', lineHeight: 1 }}>&times;</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
