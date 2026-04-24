import React from 'react';
import { useNavigate } from 'react-router-dom';

const FeatureShowcase = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'password-reset',
      name: 'Password Reset',
      icon: '🔑',
      description: 'Forgot your password? Request a reset link via email to regain access to your account.',
      color: '#EF4444',
      path: '/forgot-password',
      navigateType: 'external'
    },
    {
      id: 'change-password',
      name: 'Change Password',
      icon: '🔒',
      description: 'Update your password from the Profile page. Requires current password for security.',
      color: '#F97316',
      path: '/profile'
    },
    {
      id: 'logout',
      name: 'Logout',
      icon: '🚪',
      description: 'Securely log out from your account. Available in the sidebar footer and Profile page.',
      color: '#78716C',
      path: '/profile'
    },
    {
      id: 'sort-controls',
      name: 'Sort Controls',
      icon: '🔃',
      description: 'Sort articles, categories, tags, and more by name, date, or other criteria using dropdown controls.',
      color: '#3B82F6',
      path: '/articles'
    },
    {
      id: 'csv-export',
      name: 'CSV Export',
      icon: '📊',
      description: 'Export your data to CSV format for spreadsheets. Available on all list pages via the export button.',
      color: '#10B981',
      path: '/articles'
    },
    {
      id: 'pdf-export',
      name: 'PDF Export',
      icon: '📄',
      description: 'Generate professional PDF documents from your data. Available on all list pages via the export button.',
      color: '#8B5CF6',
      path: '/articles'
    },
    {
      id: 'bulk-select',
      name: 'Bulk Select',
      icon: '☑️',
      description: 'Select multiple items at once using checkboxes. Works across articles, categories, tags, and more.',
      color: '#06B6D4',
      path: '/articles'
    },
    {
      id: 'bulk-delete',
      name: 'Bulk Delete',
      icon: '🗑️',
      description: 'Delete multiple selected items in one action with a confirmation dialog to prevent accidental removal.',
      color: '#DC2626',
      path: '/articles'
    },
    {
      id: 'bulk-update',
      name: 'Bulk Update',
      icon: '✏️',
      description: 'Update the status of multiple articles at once. Select items and choose a new status from the bulk actions bar.',
      color: '#F59E0B',
      path: '/articles'
    },
    {
      id: 'toast-notifications',
      name: 'Toast Notifications',
      icon: '🔔',
      description: 'Non-intrusive toast messages for success, error, warning, and info feedback across all actions.',
      color: '#2563EB',
      path: '/notifications'
    },
    {
      id: 'confirm-dialogs',
      name: 'Confirmation Dialogs',
      icon: '⚠️',
      description: 'Modal confirmation dialogs before destructive actions like delete. Prevents accidental data loss.',
      color: '#D97706',
      path: '/categories'
    },
    {
      id: 'error-boundaries',
      name: 'Error Boundaries',
      icon: '🛡️',
      description: 'React Error Boundary wraps the entire app, catching rendering errors gracefully instead of a blank screen.',
      color: '#64748B',
      path: null
    },
    {
      id: 'skeleton-screens',
      name: 'Skeleton Screens',
      icon: '💀',
      description: 'Animated loading placeholders that match page layout, providing visual feedback while data loads.',
      color: '#9CA3AF',
      path: '/articles'
    },
    {
      id: 'rbac',
      name: 'Role-Based Access',
      icon: '👮',
      description: 'RBAC middleware enforces admin/editor/viewer roles. Admin-only pages and actions are protected server-side.',
      color: '#7C3AED',
      path: '/users'
    },
    {
      id: 'rate-limiting',
      name: 'Rate Limiting',
      icon: '⏱️',
      description: 'Three-tier rate limiting protects the API: general (100/15min), auth (5/15min), and AI (20/15min) endpoints.',
      color: '#0EA5E9',
      path: null
    },
    {
      id: 'helmet-headers',
      name: 'Helmet Security Headers',
      icon: '🪖',
      description: 'Express Helmet middleware sets secure HTTP headers (CSP, HSTS, X-Frame-Options) to protect against common attacks.',
      color: '#475569',
      path: null
    },
    {
      id: 'email-verification',
      name: 'Email Verification',
      icon: '📧',
      description: 'Backend endpoints for email verification tokens. Ensures valid email addresses during registration.',
      color: '#EC4899',
      path: '/profile'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Feature Showcase</h1>
          <p className="page-subtitle">All 17 built-in features of the Knowledge Base platform</p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => {
              if (feature.path) {
                if (feature.navigateType === 'external') {
                  window.open(feature.path, '_blank');
                } else {
                  navigate(feature.path);
                }
              }
            }}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: feature.path ? 'pointer' : 'default',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              if (feature.path) {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = feature.color;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: `linear-gradient(135deg, ${feature.color}20 0%, transparent 60%)`,
              borderRadius: '0 1rem 0 100%'
            }} />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '1rem',
              background: `${feature.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              {feature.icon}
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: '0.5rem'
            }}>
              {feature.name}
            </h3>
            <p style={{
              color: '#6B7280',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              marginBottom: '1rem'
            }}>
              {feature.description}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: feature.color,
              fontWeight: 500,
              fontSize: '0.875rem'
            }}>
              {feature.path ? (
                <>
                  Try it out
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '0.5rem' }}>
                    <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </>
              ) : (
                <>
                  Server-side feature
                  <span style={{ marginLeft: '0.5rem', opacity: 0.6 }}>*</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Feature Summary</h3>
        </div>
        <div className="card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            {features.map((feature) => (
              <div
                key={feature.id}
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: `${feature.color}08`,
                  borderRadius: '0.75rem'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{feature.icon}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{feature.name}</div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1rem', fontSize: '0.8125rem', color: '#9CA3AF', textAlign: 'center' }}>
            * Server-side features (Error Boundaries, Rate Limiting, Helmet Headers) work behind the scenes and do not have a dedicated page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureShowcase;
