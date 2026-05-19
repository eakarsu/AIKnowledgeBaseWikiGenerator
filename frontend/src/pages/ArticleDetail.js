import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import api from '../services/api';

const ArticleDetail = () => {
  const { addToast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false });
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [versions, setVersions] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [translateLanguage, setTranslateLanguage] = useState('Spanish');
  const [translating, setTranslating] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [submittingForReview, setSubmittingForReview] = useState(false);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showExportMenu && !e.target.closest('.export-dropdown')) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportMenu]);

  useEffect(() => {
    fetchArticle();
    fetchComments();
    fetchVersions();
    fetchTranslations();
    checkBookmark();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      setArticle(response.data);
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/articles/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await api.get(`/articles/${id}/versions`);
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to fetch versions:', error);
    }
  };

  const fetchTranslations = async () => {
    try {
      const response = await api.get(`/articles/${id}/translations`);
      setTranslations(response.data);
    } catch (error) {
      console.error('Failed to fetch translations:', error);
    }
  };

  const checkBookmark = async () => {
    try {
      const response = await api.get(`/bookmarks/${id}/check`);
      setBookmarked(response.data.bookmarked);
    } catch (error) {
      console.error('Failed to check bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    try {
      const response = await api.post(`/bookmarks/${id}`);
      setBookmarked(response.data.bookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.post(`/articles/${id}/comments`, { content: newComment });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDelete = () => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Article',
      message: 'Are you sure you want to delete this article? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/articles/${id}`);
          addToast('Article deleted', 'success');
          navigate('/articles');
        } catch (error) {
          addToast(error.response?.data?.error || 'Failed to delete article', 'error');
        }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleRestoreVersion = (versionId) => {
    setConfirmDialog({
      isOpen: true, title: 'Restore Version',
      message: 'Are you sure you want to restore this version? Current content will be saved as a new version.',
      onConfirm: async () => {
        try {
          await api.post(`/versions/${versionId}/restore`);
          fetchArticle(); fetchVersions(); setActiveTab('content');
          addToast('Version restored successfully', 'success');
        } catch (error) {
          addToast('Failed to restore version', 'error');
        }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleTranslate = async () => {
    if (!article?.content) return;

    setTranslating(true);
    try {
      const response = await api.post('/ai/translate', {
        content: article.content,
        target_language: translateLanguage,
        article_id: id
      });

      // Save translation
      await api.post(`/articles/${id}/translations`, {
        language: translateLanguage,
        title: article.title,
        content: response.data.translated,
        translated_by: 'ai'
      });

      fetchTranslations();
      addToast(`Article translated to ${translateLanguage}!`, 'success');
    } catch (error) {
      console.error('Failed to translate:', error);
      addToast('Translation failed. Check your AI configuration.', 'error');
    } finally {
      setTranslating(false);
    }
  };

  const handleDeleteTranslation = (translationId) => {
    setConfirmDialog({
      isOpen: true, title: 'Delete Translation',
      message: 'Are you sure you want to delete this translation?',
      onConfirm: async () => {
        try {
          await api.delete(`/translations/${translationId}`);
          fetchTranslations();
          addToast('Translation deleted', 'success');
        } catch (error) {
          addToast('Failed to delete translation', 'error');
        }
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleSubmitForReview = async () => {
    setSubmittingForReview(true);
    try {
      const response = await api.put(`/articles/${id}/submit-for-review`);
      setArticle(response.data);
      addToast('Article submitted for review. AI suggestions will appear as a comment shortly.', 'success');
      // Refresh comments after a short delay to pick up AI comment
      setTimeout(() => fetchComments(), 3000);
    } catch (error) {
      addToast(error.response?.data?.error || 'Failed to submit for review', 'error');
    } finally {
      setSubmittingForReview(false);
    }
  };

  const handleExport = (format) => {
    if (!article) return;

    let content = '';
    let filename = '';
    let type = '';

    if (format === 'markdown') {
      content = `# ${article.title}\n\n${article.content}`;
      filename = `${article.title.replace(/[^a-z0-9]/gi, '_')}.md`;
      type = 'text/markdown';
    } else if (format === 'json') {
      content = JSON.stringify(article, null, 2);
      filename = `${article.title.replace(/[^a-z0-9]/gi, '_')}.json`;
      type = 'application/json';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="loading-screen">Loading article...</div>;
  }

  if (!article) {
    return <div className="loading-screen">Article not found</div>;
  }

  const tabs = [
    { id: 'content', label: 'Content', icon: '📄' },
    { id: 'comments', label: `Comments (${comments.length})`, icon: '💬' },
    { id: 'versions', label: `History (${versions.length})`, icon: '📜' },
    { id: 'translations', label: `Translations (${translations.length})`, icon: '🌐' },
  ];

  return (
    <div className="article-detail">
      <div className="article-header">
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/articles')}>
          ← Back to Articles
        </button>

        <h1 className="page-title" style={{ marginTop: '1rem' }}>{article.title}</h1>

        <div className="article-meta" style={{ marginTop: '0.5rem' }}>
          <span>By {article.author_name}</span>
          <span>•</span>
          <span>{new Date(article.created_at).toLocaleDateString()}</span>
          <span>•</span>
          <span>{article.views} views</span>
          <span>•</span>
          <span className={`badge ${
            article.status === 'published' ? 'badge-success' :
            article.status === 'in-review' ? 'badge-primary' :
            article.status === 'approved' ? 'badge-success' :
            'badge-warning'
          }`}>
            {article.status === 'in-review' ? 'In Review' : article.status}
          </span>
        </div>

        {article.tags && article.tags.length > 0 && (
          <div className="tags" style={{ marginTop: '0.75rem' }}>
            {article.tags.filter(t => t && t.name).map((tag) => (
              <span key={tag.id} className="tag" style={{ background: tag.color + '20', color: tag.color }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="article-actions">
          <button className="btn btn-primary" onClick={() => navigate(`/articles/${id}/edit`)}>
            ✏️ Edit
          </button>
          {article.status === 'draft' && (
            <button
              className="btn btn-secondary"
              onClick={handleSubmitForReview}
              disabled={submittingForReview}
              style={{ background: '#8B5CF6', color: 'white', borderColor: '#8B5CF6' }}
            >
              {submittingForReview ? 'Submitting...' : 'Submit for Review'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={toggleBookmark}>
            {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
          </button>
          <div className="export-dropdown" style={{ position: 'relative', display: 'inline-block' }}>
            <button className="btn btn-secondary" onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}>
              📥 Export
            </button>
            {showExportMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                background: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10,
                minWidth: '150px',
                marginTop: '0.25rem'
              }}>
                <button onClick={() => { handleExport('markdown'); setShowExportMenu(false); }} style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  📝 Markdown
                </button>
                <button onClick={() => { handleExport('json'); setShowExportMenu(false); }} style={{ display: 'block', width: '100%', padding: '0.5rem 1rem', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  📋 JSON
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-danger" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              background: activeTab === tab.id ? '#EFF6FF' : 'transparent',
              color: activeTab === tab.id ? '#3B82F6' : '#6B7280',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 400,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="article-body">
          <ReactMarkdown>{article.content || 'No content available'}</ReactMarkdown>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleAddComment} style={{ marginBottom: '1.5rem' }}>
              <textarea
                className="form-input form-textarea"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows="3"
              />
              <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                Post Comment
              </button>
            </form>

            {comments.length > 0 ? (
              <div>
                {comments.map((comment) => {
                  const isAiReview = comment.content && comment.content.startsWith('[AI Review]');
                  return (
                    <div key={comment.id} style={{
                      padding: '1rem 0',
                      borderBottom: '1px solid #E5E7EB',
                      background: isAiReview ? '#FAFAF5' : 'transparent'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <div className="user-avatar" style={{
                          width: '1.5rem', height: '1.5rem', fontSize: '0.75rem',
                          background: isAiReview ? '#8B5CF6' : undefined
                        }}>
                          {isAiReview ? 'AI' : (comment.user_name?.charAt(0).toUpperCase() || 'U')}
                        </div>
                        <strong style={{ fontSize: '0.875rem' }}>
                          {isAiReview ? 'AI Review' : comment.user_name}
                        </strong>
                        {isAiReview && (
                          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '9999px', background: '#8B5CF620', color: '#8B5CF6', fontWeight: 600 }}>
                            AI Review
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.875rem', color: '#374151', whiteSpace: 'pre-line' }}>{comment.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      )}

      {/* Version History Tab */}
      {activeTab === 'versions' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Version History</h3>
          </div>
          <div className="card-body">
            {versions.length > 0 ? (
              <div>
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #E5E7EB',
                      background: selectedVersion?.id === version.id ? '#EFF6FF' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedVersion(selectedVersion?.id === version.id ? null : version)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span className="badge badge-gray" style={{ marginRight: '0.5rem' }}>
                          v{version.version_number}
                        </span>
                        <strong>{version.title}</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          {version.changed_by_name} • {new Date(version.created_at).toLocaleString()}
                        </span>
                        {index > 0 && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRestoreVersion(version.id);
                            }}
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                    {selectedVersion?.id === version.id && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#F9FAFB', borderRadius: '0.5rem' }}>
                        <div className="article-body" style={{ maxHeight: '300px', overflow: 'auto' }}>
                          <ReactMarkdown>{version.content}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No version history yet. Versions are created when you edit the article.</p>
            )}
          </div>
        </div>
      )}

      {/* Translations Tab */}
      {activeTab === 'translations' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Translations</h3>
          </div>
          <div className="card-body">
            {/* AI Translate */}
            <div style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 500 }}>🤖 AI Translate to:</span>
                <select
                  className="form-input form-select"
                  value={translateLanguage}
                  onChange={(e) => setTranslateLanguage(e.target.value)}
                  style={{ width: 'auto' }}
                >
                  <option>Spanish</option>
                  <option>French</option>
                  <option>German</option>
                  <option>Italian</option>
                  <option>Portuguese</option>
                  <option>Japanese</option>
                  <option>Korean</option>
                  <option>Chinese</option>
                  <option>Russian</option>
                  <option>Arabic</option>
                  <option>Hindi</option>
                  <option>Dutch</option>
                </select>
                <button
                  className="btn btn-primary"
                  onClick={handleTranslate}
                  disabled={translating}
                >
                  {translating ? '⏳ Translating...' : '🌐 Translate'}
                </button>
              </div>
            </div>

            {/* Existing Translations */}
            {translations.length > 0 ? (
              <div>
                {translations.map((translation) => (
                  <div
                    key={translation.id}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #E5E7EB'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="badge badge-primary">{translation.language}</span>
                        <strong>{translation.title || article.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                          ({translation.translated_by === 'ai' ? '🤖 AI' : '✍️ Manual'})
                        </span>
                      </div>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteTranslation(translation.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{ padding: '1rem', background: '#F9FAFB', borderRadius: '0.5rem', maxHeight: '200px', overflow: 'auto' }}>
                      <ReactMarkdown>{translation.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>No translations yet. Use AI to translate this article!</p>
            )}
          </div>
        </div>
      )}

          <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog({ isOpen: false })} confirmText="Confirm" variant="danger" />
          </div>
  );
};

export default ArticleDetail;
