import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const SmartSuggestions = () => {
  const { addToast } = useToast();
  const [suggestions, setSuggestions] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [filterArticleId, setFilterArticleId] = useState('');
  const [filterApplied, setFilterApplied] = useState('');

  useEffect(() => {
    fetchSuggestions();
    fetchArticles();
  }, []);

  const fetchSuggestions = async (filters = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.articleId || filterArticleId) params.append('article_id', filters.articleId || filterArticleId);
      if (filters.applied !== undefined ? filters.applied !== '' : filterApplied !== '') {
        params.append('applied', filters.applied !== undefined ? filters.applied : filterApplied);
      }
      const response = await api.get(`/smart-suggestions?${params}`);
      setSuggestions(response.data);
    } catch (error) {
      addToast('Failed to load suggestions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchArticles = async () => {
    try {
      const response = await api.get('/articles?limit=100');
      setArticles(response.data);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
    }
  };

  const handleAutoGenerate = async () => {
    if (!selectedArticleId) {
      addToast('Please select an article to generate suggestions for', 'warning');
      return;
    }
    setAutoGenerating(true);
    try {
      const response = await api.post(`/smart-suggestions/auto-generate/${selectedArticleId}`);
      addToast(`${response.data.count} suggestion(s) created from ${response.data.entitiesExtracted} extracted entities`, 'success');
      fetchSuggestions();
    } catch (error) {
      addToast(error.response?.data?.error || 'Auto-generate failed', 'error');
    } finally {
      setAutoGenerating(false);
    }
  };

  const handleMarkApplied = async (id, applied) => {
    try {
      await api.put(`/smart-suggestions/${id}`, { applied: !applied });
      addToast(applied ? 'Marked as unapplied' : 'Marked as applied', 'success');
      fetchSuggestions();
    } catch (error) {
      addToast('Failed to update suggestion', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/smart-suggestions/${id}`);
      addToast('Suggestion deleted', 'success');
      setSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      addToast('Failed to delete suggestion', 'error');
    }
  };

  const handleFilterChange = () => {
    fetchSuggestions({ articleId: filterArticleId, applied: filterApplied });
  };

  const appliedCount = suggestions.filter(s => s.applied).length;
  const pendingCount = suggestions.filter(s => !s.applied).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Suggestions</h1>
          <p className="page-subtitle">
            AI-generated content improvement and related article suggestions
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total', value: suggestions.length, color: '#3B82F6' },
          { label: 'Pending', value: pendingCount, color: '#F59E0B' },
          { label: 'Applied', value: appliedCount, color: '#10B981' }
        ].map(stat => (
          <div key={stat.label} className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ color: '#6B7280', fontSize: '0.875rem' }}>{stat.label} Suggestions</div>
            </div>
          </div>
        ))}
      </div>

      {/* Auto-Generate Panel */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <div className="card-header">
          <h3 className="card-title">Auto-Generate Suggestions</h3>
        </div>
        <div className="card-body">
          <p style={{ color: '#4B5563', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Select an article and click Auto-Generate. The AI will extract entities from the article content and find related articles to suggest.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                Select Article
              </label>
              <select
                className="form-input form-select"
                value={selectedArticleId}
                onChange={(e) => setSelectedArticleId(e.target.value)}
              >
                <option value="">-- Choose an article --</option>
                {articles.map(a => (
                  <option key={a.id} value={a.id}>{a.title}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleAutoGenerate}
              disabled={autoGenerating || !selectedArticleId}
            >
              {autoGenerating ? 'Generating...' : 'Auto-Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Filter by Article</label>
            <select className="form-input form-select" value={filterArticleId} onChange={(e) => setFilterArticleId(e.target.value)}>
              <option value="">All Articles</option>
              {articles.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Status</label>
            <select className="form-input form-select" value={filterApplied} onChange={(e) => setFilterApplied(e.target.value)}>
              <option value="">All</option>
              <option value="false">Pending</option>
              <option value="true">Applied</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={handleFilterChange}>Apply Filters</button>
          <button className="btn btn-secondary" onClick={() => { setFilterArticleId(''); setFilterApplied(''); fetchSuggestions({}); }}>Clear</button>
        </div>
      </div>

      {/* Suggestions List */}
      {loading ? (
        <div className="loading-screen">Loading suggestions...</div>
      ) : suggestions.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="card" style={{ opacity: suggestion.applied ? 0.7 : 1 }}>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span className={`badge ${suggestion.applied ? 'badge-success' : 'badge-warning'}`}>
                        {suggestion.applied ? 'Applied' : 'Pending'}
                      </span>
                      <span className="badge badge-gray">{suggestion.suggestion_type || 'general'}</span>
                      {suggestion.article_title && (
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          Article: <strong>{suggestion.article_title}</strong>
                        </span>
                      )}
                    </div>
                    <p style={{ color: '#374151', fontSize: '0.875rem', margin: 0 }}>{suggestion.suggestion}</p>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                      {new Date(suggestion.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <button
                      className={`btn btn-sm ${suggestion.applied ? 'btn-secondary' : 'btn-success'}`}
                      onClick={() => handleMarkApplied(suggestion.id, suggestion.applied)}
                    >
                      {suggestion.applied ? 'Undo' : 'Mark Applied'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(suggestion.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">💡</div>
            <div className="empty-title">No suggestions yet</div>
            <div className="empty-text">
              Use Auto-Generate to create AI-powered suggestions for your articles
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
