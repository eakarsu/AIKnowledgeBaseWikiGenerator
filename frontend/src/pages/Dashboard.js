import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonStats, SkeletonTable } from '../components/SkeletonLoader';
import api from '../services/api';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Articles', value: data?.stats?.totalArticles || 0, icon: '📄', color: '#3B82F6', path: '/articles' },
    { label: 'Categories', value: data?.stats?.totalCategories || 0, icon: '📁', color: '#10B981', path: '/categories' },
    { label: 'Tags', value: data?.stats?.totalTags || 0, icon: '🏷️', color: '#8B5CF6', path: '/tags' },
    { label: 'Team Members', value: data?.stats?.totalUsers || 0, icon: '👥', color: '#F59E0B', path: '/teams' },
  ];

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome to your Knowledge Base</p>
          </div>
        </div>
        <SkeletonStats count={4} />
        <div className="grid grid-2">
          <SkeletonTable rows={5} cols={4} />
          <SkeletonTable rows={5} cols={3} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to your Knowledge Base</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => navigate('/articles/new')}>+ New Article</button>
          <button className="btn btn-primary" style={{ background: '#8B5CF6' }} onClick={() => navigate('/ai-features')}>AI Features</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/articles/new')}>New Article</button>
            <button className="btn btn-secondary" onClick={() => navigate('/categories')}>Manage Categories</button>
            <button className="btn btn-secondary" onClick={() => navigate('/templates')}>Browse Templates</button>
            <button className="btn btn-secondary" onClick={() => navigate('/search')}>Search Content</button>
            <button className="btn btn-primary" onClick={() => navigate('/ai-features')}>AI Features</button>
            <button className="btn btn-secondary" onClick={() => navigate('/ai-tools')}>AI Content Generator</button>
            <button className="btn btn-secondary" onClick={() => navigate('/teams')}>Team Management</button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card" onClick={() => navigate(stat.path)}>
            <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Articles</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/articles')}>View All</button>
          </div>
          <div className="card-body">
            {data?.recentArticles?.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Title</th><th>Author</th><th>Status</th><th>Views</th></tr></thead>
                  <tbody>
                    {data.recentArticles.map((article) => (
                      <tr key={article.id} onClick={() => navigate(`/articles/${article.id}`)}>
                        <td>{article.title}</td>
                        <td>{article.author_name}</td>
                        <td><span className={`badge ${article.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{article.status}</span></td>
                        <td>{article.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon">📄</div><p>No articles yet</p></div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Top Viewed Articles</h3></div>
          <div className="card-body">
            {data?.topViewed?.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Title</th><th>Category</th><th>Views</th></tr></thead>
                  <tbody>
                    {data.topViewed.map((article) => (
                      <tr key={article.id} onClick={() => navigate(`/articles/${article.id}`)}>
                        <td>{article.title}</td>
                        <td>{article.category_name || '-'}</td>
                        <td>{article.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon">📊</div><p>No data available</p></div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '1.5rem' }}>
        <div className="card">
          <div className="card-header"><h3 className="card-title">Articles by Status</h3></div>
          <div className="card-body">
            {data?.articlesByStatus?.map((item) => (
              <div key={item.status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #E5E7EB' }}>
                <span style={{ textTransform: 'capitalize' }}>{item.status}</span>
                <span className="badge badge-gray">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Articles by Category</h3></div>
          <div className="card-body">
            {data?.articlesByCategory?.slice(0, 5).map((item) => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #E5E7EB' }}>
                <span>{item.name}</span>
                <span className="badge badge-primary">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
