import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading analytics...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your knowledge base performance</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/articles')}>
          <div className="stat-icon" style={{ background: '#DBEAFE', color: '#3B82F6' }}>📄</div>
          <div className="stat-value">{data?.stats?.totalArticles || 0}</div>
          <div className="stat-label">Total Articles</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/categories')}>
          <div className="stat-icon" style={{ background: '#D1FAE5', color: '#10B981' }}>📁</div>
          <div className="stat-value">{data?.stats?.totalCategories || 0}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/tags')}>
          <div className="stat-icon" style={{ background: '#EDE9FE', color: '#8B5CF6' }}>🏷️</div>
          <div className="stat-value">{data?.stats?.totalTags || 0}</div>
          <div className="stat-label">Tags</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/teams')}>
          <div className="stat-icon" style={{ background: '#FEF3C7', color: '#F59E0B' }}>👥</div>
          <div className="stat-value">{data?.stats?.totalUsers || 0}</div>
          <div className="stat-label">Users</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Articles by Status</h3>
          </div>
          <div className="card-body">
            {data?.articlesByStatus?.map((item) => (
              <div key={item.status} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{item.status}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: '100px',
                    height: '8px',
                    background: '#E5E7EB',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(item.count / data.stats.totalArticles) * 100}%`,
                      background: item.status === 'published' ? '#10B981' : '#F59E0B',
                      borderRadius: '4px'
                    }} />
                  </div>
                  <span className="badge badge-gray">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Categories</h3>
          </div>
          <div className="card-body">
            {data?.articlesByCategory?.slice(0, 5).map((item, index) => (
              <div key={item.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem 0',
                borderBottom: '1px solid #E5E7EB'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: '#EFF6FF',
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {index + 1}
                  </span>
                  <span style={{ fontWeight: 500 }}>{item.name}</span>
                </div>
                <span className="badge badge-primary">{item.count} articles</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">Most Viewed Articles</h3>
        </div>
        <div className="card-body">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Article</th>
                  <th>Category</th>
                  <th>Views</th>
                </tr>
              </thead>
              <tbody>
                {data?.topViewed?.map((article, index) => (
                  <tr key={article.id} onClick={() => navigate(`/articles/${article.id}`)}>
                    <td>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: index < 3 ? '#FEF3C7' : '#F3F4F6',
                        color: index < 3 ? '#B45309' : '#6B7280',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {index + 1}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{article.title}</td>
                    <td>{article.category_name || '-'}</td>
                    <td>
                      <span className="badge badge-success">{article.views} views</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
