import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { SkeletonArticleList } from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => { fetchBookmarks(); }, []);

  const fetchBookmarks = async () => {
    try { const r = await api.get('/bookmarks'); setBookmarks(r.data); }
    catch { addToast('Failed to load bookmarks', 'error'); }
    finally { setLoading(false); }
  };

  const sorted = useMemo(() => {
    return [...bookmarks].sort((a, b) => {
      let aV = a[sortBy], bV = b[sortBy];
      if (typeof aV === 'string') { aV = aV.toLowerCase(); bV = (bV || '').toLowerCase(); }
      return sortOrder === 'asc' ? (aV < bV ? -1 : 1) : (aV > bV ? -1 : 1);
    });
  }, [bookmarks, sortBy, sortOrder]);

  const handleRemove = async (articleId, e) => {
    e.stopPropagation();
    try {
      await api.post(`/bookmarks/${articleId}`);
      fetchBookmarks();
      addToast('Bookmark removed', 'success');
    } catch { addToast('Failed to remove bookmark', 'error'); }
  };

  const cols = [
    { label: 'Title', key: 'title' },
    { label: 'Category', key: 'category_name' },
    { label: 'Views', key: 'views' },
    { label: 'Saved', accessor: (b) => new Date(b.created_at).toLocaleDateString() }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bookmarks</h1>
          <p className="page-subtitle">Your saved articles for quick access</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => { exportToCSV(bookmarks, cols, 'bookmarks.csv'); addToast('CSV exported', 'success'); }}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportToPDF('Bookmarks', bookmarks, cols)}>PDF</button>
        </div>
      </div>

      {bookmarks.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <div className="card-body" style={{ padding: '0.75rem 1.5rem' }}>
            <select className="form-input form-select" value={`${sortBy}-${sortOrder}`}
              onChange={(e) => { const [f, o] = e.target.value.split('-'); setSortBy(f); setSortOrder(o); }}
              style={{ maxWidth: '200px' }}>
              <option value="created_at-desc">Recently Saved</option>
              <option value="created_at-asc">Oldest Saved</option>
              <option value="title-asc">Title A-Z</option>
              <option value="views-desc">Most Viewed</option>
            </select>
          </div>
        </div>
      )}

      {loading ? <SkeletonArticleList count={5} /> : sorted.length > 0 ? (
        <div className="article-list">
          {sorted.map((bookmark) => (
            <div key={bookmark.id} className="article-item" onClick={() => navigate(`/articles/${bookmark.article_id}`)}>
              <div className="article-content">
                <h3 className="article-title">{bookmark.title}</h3>
                <p className="article-summary">{bookmark.summary || 'No summary'}</p>
                <div className="article-meta">
                  <span>{bookmark.category_name || 'Uncategorized'}</span>
                  <span>{bookmark.views} views</span>
                  <span>Saved {new Date(bookmark.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={(e) => handleRemove(bookmark.article_id, e)}>Remove</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="empty-state"><div className="empty-icon">🔖</div><div className="empty-title">No bookmarks yet</div><div className="empty-text">Save articles for quick access later</div><button className="btn btn-primary" onClick={() => navigate('/articles')}>Browse Articles</button></div></div>
      )}
    </div>
  );
};

export default Bookmarks;
