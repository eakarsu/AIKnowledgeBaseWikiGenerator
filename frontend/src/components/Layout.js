import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { section: 'Main', items: [
      { path: '/', icon: '📊', label: 'Dashboard' },
      { path: '/articles', icon: '📄', label: 'Articles' },
      { path: '/categories', icon: '📁', label: 'Categories' },
      { path: '/tags', icon: '🏷️', label: 'Tags' },
    ]},
    { section: 'Resources', items: [
      { path: '/templates', icon: '📝', label: 'Templates' },
      { path: '/teams', icon: '👥', label: 'Teams' },
      { path: '/bookmarks', icon: '🔖', label: 'Bookmarks' },
    ]},
    { section: 'Tools', items: [
      { path: '/search', icon: '🔍', label: 'Search' },
      { path: '/ai-features', icon: '✨', label: 'AI Features' },
      { path: '/ai-tools', icon: '🤖', label: 'AI Tools' },
      { path: '/knowledge-graph', icon: '🕸️', label: 'Knowledge Graph' },
      { path: '/smart-suggestions', icon: '💡', label: 'Smart Suggestions' },
      { path: '/features', icon: '🏆', label: 'Features' },
      { path: '/analytics', icon: '📈', label: 'Analytics' },
      { path: '/custom-views', icon: '🧩', label: 'KB Views' },
    ]},
    { section: 'Account', items: [
      { path: '/notifications', icon: '🔔', label: 'Notifications' },
      { path: '/users', icon: '👥', label: 'Users' },
      { path: '/profile', icon: '👤', label: 'Profile' },
    ]},
  ];

  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="layout">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
        <span className="mobile-logo">📚 Knowledge Base</span>
        <div className="user-avatar" style={{ width: '2rem', height: '2rem', fontSize: '0.75rem' }}>
          {user?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {/* Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <NavLink to="/" className="sidebar-logo" onClick={handleNavClick}>
            📚 Knowledge Base
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((group) => (
            <div key={group.section} className="nav-section">
              <div className="nav-section-title">{group.section}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end={item.path === '/'}
                  onClick={handleNavClick}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-menu" onClick={handleLogout}>
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-email">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      <style>{`
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: white;
          border-bottom: 1px solid #E5E7EB;
          padding: 0 1rem;
          align-items: center;
          justify-content: space-between;
          z-index: 100;
        }

        .mobile-menu-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0.5rem;
        }

        .mobile-logo {
          font-weight: 700;
          color: #3B82F6;
        }

        .sidebar-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          z-index: 150;
        }

        @media (max-width: 768px) {
          .mobile-header {
            display: flex;
          }

          .sidebar {
            transform: translateX(-100%);
            z-index: 200;
          }

          .sidebar.open {
            transform: translateX(0);
          }

          .sidebar-overlay {
            display: block;
          }

          .main-content {
            margin-left: 0;
            padding-top: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
