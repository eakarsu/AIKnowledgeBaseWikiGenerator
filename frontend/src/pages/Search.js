import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allData, setAllData] = useState({ articles: [], categories: [], tags: [], templates: [], teams: [] });
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  // Load initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [articlesRes, categoriesRes, tagsRes, templatesRes, teamsRes] = await Promise.all([
        api.get('/articles'),
        api.get('/categories'),
        api.get('/tags'),
        api.get('/templates'),
        api.get('/teams')
      ]);
      const data = {
        articles: articlesRes.data,
        categories: categoriesRes.data,
        tags: tagsRes.data,
        templates: templatesRes.data,
        teams: teamsRes.data
      };
      setAllData(data);
      setArticles(data.articles);
      setCategories(data.categories);
      setTags(data.tags);
      setTemplates(data.templates);
      setTeams(data.teams);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = (searchQuery) => {
    if (!searchQuery.trim()) {
      setArticles(allData.articles);
      setCategories(allData.categories);
      setTags(allData.tags);
      setTemplates(allData.templates);
      setTeams(allData.teams);
      setSearchLoading(false);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();

    setArticles(allData.articles.filter(a =>
      a.title.toLowerCase().includes(lowerQuery) ||
      a.summary?.toLowerCase().includes(lowerQuery) ||
      a.author_name?.toLowerCase().includes(lowerQuery)
    ));
    setCategories(allData.categories.filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description?.toLowerCase().includes(lowerQuery)
    ));
    setTags(allData.tags.filter(t =>
      t.name.toLowerCase().includes(lowerQuery)
    ));
    setTemplates(allData.templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    ));
    setTeams(allData.teams.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery)
    ));
    setSearchLoading(false);
  };

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSearchLoading(true);

    // Debounce search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const totalResults = articles.length + categories.length + tags.length + templates.length + teams.length;

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Search</h1>
          <p className="page-subtitle">Find articles, categories, tags, templates, and teams</p>
        </div>
      </div>

      <div className="search-container" style={{ marginBottom: '2rem' }}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Start typing to search..."
            value={query}
            onChange={handleQueryChange}
            autoFocus
          />
          {searchLoading && (
            <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}>
              Searching...
            </span>
          )}
        </div>
        {query && (
          <p style={{ marginTop: '0.5rem', color: '#6B7280', fontSize: '0.875rem' }}>
            Found {totalResults} results for "{query}"
          </p>
        )}
      </div>

      {/* Articles Section */}
      {articles.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">📄 Articles ({articles.length})</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/articles')}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Status</th>
                    <th>Views</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.slice(0, 10).map((article) => (
                    <tr key={article.id} onClick={() => navigate(`/articles/${article.id}`)}>
                      <td style={{ fontWeight: 500 }}>{article.title}</td>
                      <td>{article.category_name || '-'}</td>
                      <td>{article.author_name}</td>
                      <td>
                        <span className={`badge ${article.status === 'published' ? 'badge-success' : 'badge-warning'}`}>
                          {article.status}
                        </span>
                      </td>
                      <td>{article.views}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {articles.length > 10 && (
              <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid #E5E7EB' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => navigate('/articles')}>
                  View all {articles.length} articles
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">📁 Categories ({categories.length})</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/categories')}>
              View All
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {categories.slice(0, 12).map((category) => (
                <div
                  key={category.id}
                  onClick={() => navigate(`/categories/${category.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    background: category.color + '15',
                    border: `1px solid ${category.color}40`,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>📁</span>
                  <div>
                    <div style={{ fontWeight: 500, color: category.color }}>{category.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{category.article_count} articles</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">🏷️ Tags ({tags.length})</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/tags')}>
              View All
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {tags.slice(0, 20).map((tag) => (
                <div
                  key={tag.id}
                  onClick={() => navigate(`/tags/${tag.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '9999px',
                    background: tag.color + '20',
                    color: tag.color,
                    cursor: 'pointer',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    transition: 'all 0.15s'
                  }}
                >
                  #{tag.name}
                  <span style={{
                    background: 'white',
                    padding: '0.125rem 0.375rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    color: '#6B7280'
                  }}>
                    {tag.article_count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates Section */}
      {templates.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">📝 Templates ({templates.length})</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/templates')}>
              View All
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {templates.slice(0, 6).map((template) => (
                <div
                  key={template.id}
                  onClick={() => navigate(`/templates/${template.id}`)}
                  style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{template.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{template.category || 'General'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Teams Section */}
      {teams.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">👥 Teams ({teams.length})</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/teams')}>
              View All
            </button>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {teams.slice(0, 6).map((team) => (
                <div
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #E5E7EB',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    background: '#DBEAFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    👥
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{team.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{team.member_count} members</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {totalResults === 0 && query && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No results found</div>
            <div className="empty-text">Try different keywords or browse the categories</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
