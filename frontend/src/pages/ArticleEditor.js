import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

const ArticleEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [article, setArticle] = useState({
    title: '',
    content: '',
    summary: '',
    status: 'draft',
    category_id: '',
    tags: []
  });

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchTemplates();
    if (id) {
      fetchArticle();
    } else if (location.state?.template) {
      // If coming from template page
      setArticle(prev => ({ ...prev, content: location.state.template }));
    }
  }, [id, location.state]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      const data = response.data;
      setArticle({
        title: data.title,
        content: data.content || '',
        summary: data.summary || '',
        status: data.status,
        category_id: data.category_id || '',
        tags: data.tags?.map(t => t.id) || []
      });
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/tags');
      setTags(response.data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/templates');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const handleUseTemplate = (template) => {
    setArticle(prev => ({
      ...prev,
      content: template.content,
      title: prev.title || template.name
    }));
    setShowTemplates(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (id) {
        await api.put(`/articles/${id}`, article);
      } else {
        const response = await api.post('/articles', article);
        navigate(`/articles/${response.data.id}`);
        return;
      }
      navigate(`/articles/${id}`);
    } catch (error) {
      console.error('Failed to save article:', error);
      alert('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!article.title) {
      alert('Please enter a title first');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/ai/generate', { topic: article.title, type: 'article' });
      setArticle({ ...article, content: response.data.content });
    } catch (error) {
      console.error('Failed to generate content:', error);
      alert('Failed to generate content. Make sure your OpenRouter API key is configured.');
    } finally {
      setSaving(false);
    }
  };

  const handleAISummarize = async () => {
    if (!article.content) {
      alert('Please add content first');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post('/ai/summarize', { content: article.content });
      setArticle({ ...article, summary: response.data.summary });
    } catch (error) {
      console.error('Failed to summarize:', error);
      alert('Failed to generate summary');
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId) => {
    const newTags = article.tags.includes(tagId)
      ? article.tags.filter(t => t !== tagId)
      : [...article.tags, tagId];
    setArticle({ ...article, tags: newTags });
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{id ? 'Edit Article' : 'New Article'}</h1>
          <p className="page-subtitle">Create or edit your knowledge base article</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="editor-container">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              type="text"
              className="form-input"
              value={article.title}
              onChange={(e) => setArticle({ ...article, title: e.target.value })}
              placeholder="Enter article title"
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Content (Markdown)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowTemplates(true)}>
                  📝 Use Template
                </button>
                <button type="button" className="btn btn-sm btn-secondary" onClick={handleAIGenerate} disabled={saving}>
                  🤖 AI Generate
                </button>
              </div>
            </div>
            <textarea
              className="form-input form-textarea content-editor"
              value={article.content}
              onChange={(e) => setArticle({ ...article, content: e.target.value })}
              placeholder="Write your content in Markdown..."
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Summary</label>
              <button type="button" className="btn btn-sm btn-secondary" onClick={handleAISummarize} disabled={saving}>
                🤖 AI Summarize
              </button>
            </div>
            <textarea
              className="form-input form-textarea"
              value={article.summary}
              onChange={(e) => setArticle({ ...article, summary: e.target.value })}
              placeholder="Brief summary of the article"
              rows="3"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input form-select"
                value={article.category_id}
                onChange={(e) => setArticle({ ...article, category_id: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-input form-select"
                value={article.status}
                onChange={(e) => setArticle({ ...article, status: e.target.value })}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <div className="tags" style={{ flexWrap: 'wrap' }}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="tag"
                  style={{
                    background: article.tags.includes(tag.id) ? tag.color : '#F3F4F6',
                    color: article.tags.includes(tag.id) ? 'white' : '#374151',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (id ? 'Update Article' : 'Create Article')}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
              Cancel
            </button>
          </div>
        </div>
      </form>

      {/* Template Modal */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📝 Choose a Template</h3>
              <button className="modal-close" onClick={() => setShowTemplates(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {templates.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleUseTemplate(template)}
                      style={{
                        padding: '1rem',
                        border: '1px solid #E5E7EB',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = '#3B82F6';
                        e.currentTarget.style.background = '#EFF6FF';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{template.name}</h4>
                      <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                        {template.description || 'No description'}
                      </p>
                      {template.category && (
                        <span className="badge badge-gray">{template.category}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <div className="empty-title">No templates available</div>
                  <div className="empty-text">Create templates to speed up content creation</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArticleEditor;
