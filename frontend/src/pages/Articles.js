import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonArticleList } from '../components/SkeletonLoader';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import api from '../services/api';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const ITEMS_PER_PAGE = 10;
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    setPage(1);
    fetchArticles(1);
  }, [filter, sortBy, sortOrder]);

  const fetchArticles = async (pageNum = page) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);
      params.append('limit', ITEMS_PER_PAGE);
      params.append('offset', (pageNum - 1) * ITEMS_PER_PAGE);
      params.append('sort', sortBy);
      params.append('order', sortOrder);

      const response = await api.get(`/articles?${params}`);
      setArticles(response.data);
      setHasMore(response.data.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      addToast('Failed to load articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    fetchArticles(newPage);
    window.scrollTo(0, 0);
  };

  const handleRowClick = (id) => {
    navigate(`/articles/${id}`);
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === articles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(articles.map(a => a.id)));
    }
  };

  const handleBulkDelete = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Articles',
      message: `Are you sure you want to delete ${selectedIds.size} selected article(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await api.post('/articles/bulk-delete', { ids: Array.from(selectedIds) });
          addToast(`${selectedIds.size} articles deleted`, 'success');
          setSelectedIds(new Set());
          fetchArticles(page);
        } catch (error) {
          addToast('Failed to delete articles', 'error');
        }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      await api.put('/articles/bulk-update', { ids: Array.from(selectedIds), updates: { status } });
      addToast(`${selectedIds.size} articles updated to ${status}`, 'success');
      setSelectedIds(new Set());
      fetchArticles(page);
    } catch (error) {
      addToast('Failed to update articles', 'error');
    }
  };

  const handleExportCSV = () => {
    exportToCSV(articles, [
      { label: 'Title', key: 'title' },
      { label: 'Author', key: 'author_name' },
      { label: 'Status', key: 'status' },
      { label: 'Views', key: 'views' },
      { label: 'Created', accessor: (a) => new Date(a.created_at).toLocaleDateString() }
    ], 'articles.csv');
    addToast('CSV exported', 'success');
  };

  const handleExportPDF = () => {
    exportToPDF('Articles', articles, [
      { label: 'Title', key: 'title' },
      { label: 'Author', key: 'author_name' },
      { label: 'Status', key: 'status' },
      { label: 'Views', key: 'views' },
      { label: 'Created', accessor: (a) => new Date(a.created_at).toLocaleDateString() }
    ]);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">{articles.length} articles in your knowledge base</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>CSV</button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportPDF}>PDF</button>
          <button className="btn btn-primary" onClick={() => navigate('/articles/new')}>
            + New Article
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search articles..."
            value={filter.search}
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
            style={{ maxWidth: '300px' }}
          />
          <select
            className="form-input form-select"
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            style={{ maxWidth: '200px' }}
          >
            <option value="">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select
            className="form-input form-select"
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            style={{ maxWidth: '200px' }}
          >
            <option value="updated_at-desc">Recently Updated</option>
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="title-asc">Title A-Z</option>
            <option value="title-desc">Title Z-A</option>
            <option value="views-desc">Most Viewed</option>
          </select>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="card" style={{ marginBottom: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem' }}>
            <span style={{ fontWeight: 500 }}>{selectedIds.size} selected</span>
            <button className="btn btn-sm btn-danger" onClick={handleBulkDelete}>Delete Selected</button>
            <button className="btn btn-sm btn-success" onClick={() => handleBulkStatusUpdate('published')}>Publish</button>
            <button className="btn btn-sm btn-warning" onClick={() => handleBulkStatusUpdate('draft')}>Set Draft</button>
            <button className="btn btn-sm btn-secondary" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonArticleList count={5} />
      ) : articles.length > 0 ? (
        <>
          <div style={{ marginBottom: '0.5rem', padding: '0 0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#6B7280', cursor: 'pointer' }}>
              <input type="checkbox" checked={selectedIds.size === articles.length && articles.length > 0} onChange={toggleSelectAll} />
              Select All
            </label>
          </div>
          <div className="article-list">
            {articles.map((article) => (
              <div
                key={article.id}
                className="article-item"
                onClick={() => handleRowClick(article.id)}
                style={{ background: selectedIds.has(article.id) ? '#EFF6FF' : 'white' }}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(article.id)}
                  onChange={(e) => toggleSelect(article.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ marginTop: '0.25rem' }}
                />
                <div className="article-content">
                  <h3 className="article-title">{article.title}</h3>
                  <p className="article-summary">{article.summary || 'No summary available'}</p>
                  <div className="article-meta">
                    <span>By {article.author_name}</span>
                    <span>{formatDate(article.created_at)}</span>
                    <span>{article.views} views</span>
                    <span className={`badge ${article.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                      {article.status}
                    </span>
                  </div>
                  {article.tags && article.tags.length > 0 && (
                    <div className="tags" style={{ marginTop: '0.75rem' }}>
                      {article.tags.filter(t => t).map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn btn-secondary" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
              Previous
            </button>
            <span style={{ color: '#6B7280' }}>Page {page}</span>
            <button className="btn btn-secondary" onClick={() => handlePageChange(page + 1)} disabled={!hasMore}>
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <div className="empty-title">No articles found</div>
            <div className="empty-text">
              {filter.search || filter.status
                ? 'Try adjusting your filters'
                : 'Create your first article to get started'}
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/articles/new')}>
              Create Article
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false })}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Articles;
