import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const entityTypeColors = {
  Person: '#3B82F6',
  Organization: '#10B981',
  Technology: '#8B5CF6',
  Concept: '#F59E0B',
  Location: '#EF4444',
  Event: '#EC4899',
  Product: '#06B6D4',
};

const KnowledgeGraph = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('extract');

  // Extract Entities state
  const [extractText, setExtractText] = useState('');
  const [extractDocType, setExtractDocType] = useState('text');
  const [extractResult, setExtractResult] = useState(null);
  const [extractLoading, setExtractLoading] = useState(false);

  // Query Graph state
  const [queryQuestion, setQueryQuestion] = useState('');
  const [queryContext, setQueryContext] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);

  // Find Connections state
  const [entity1, setEntity1] = useState('');
  const [entity2, setEntity2] = useState('');
  const [connectionsResult, setConnectionsResult] = useState(null);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  const handleExtractEntities = async (e) => {
    e.preventDefault();
    if (!extractText.trim()) return;
    setExtractLoading(true);
    setExtractResult(null);
    try {
      const response = await api.post('/knowledge-graph-agents/extract-entities', {
        text: extractText,
        doc_type: extractDocType
      });
      setExtractResult(response.data);
    } catch (error) {
      addToast(error.response?.data?.error || 'Entity extraction failed', 'error');
    } finally {
      setExtractLoading(false);
    }
  };

  const handleQueryGraph = async (e) => {
    e.preventDefault();
    if (!queryQuestion.trim()) return;
    setQueryLoading(true);
    setQueryResult(null);
    try {
      const response = await api.post('/knowledge-graph-agents/query-graph', {
        question: queryQuestion,
        context: queryContext
      });
      setQueryResult(response.data);
    } catch (error) {
      addToast(error.response?.data?.error || 'Query failed', 'error');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleFindConnections = async (e) => {
    e.preventDefault();
    if (!entity1.trim() || !entity2.trim()) return;
    setConnectionsLoading(true);
    setConnectionsResult(null);
    try {
      const response = await api.post('/knowledge-graph-agents/find-connections', {
        entity1,
        entity2
      });
      setConnectionsResult(response.data);
    } catch (error) {
      addToast(error.response?.data?.error || 'Connection search failed', 'error');
    } finally {
      setConnectionsLoading(false);
    }
  };

  const tabs = [
    { id: 'extract', label: 'Extract Entities', icon: '🔍' },
    { id: 'query', label: 'Query Graph', icon: '❓' },
    { id: 'connections', label: 'Find Connections', icon: '🔗' },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Knowledge Graph</h1>
          <p className="page-subtitle">
            AI-powered entity extraction, graph querying, and connection finding
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #E5E7EB', paddingBottom: '0.5rem' }}>
        {tabs.map(tab => (
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

      {/* Extract Entities Tab */}
      {activeTab === 'extract' && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Extract Entities from Text</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleExtractEntities}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Document Type
                  </label>
                  <select
                    className="form-input form-select"
                    value={extractDocType}
                    onChange={(e) => setExtractDocType(e.target.value)}
                    style={{ maxWidth: '200px' }}
                  >
                    <option value="text">General Text</option>
                    <option value="article">Article</option>
                    <option value="report">Report</option>
                    <option value="documentation">Documentation</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Paste Text to Analyze
                  </label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Paste your text here to extract entities like people, organizations, technologies, concepts..."
                    value={extractText}
                    onChange={(e) => setExtractText(e.target.value)}
                    rows="6"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={extractLoading || !extractText.trim()}>
                  {extractLoading ? 'Extracting...' : 'Extract Entities'}
                </button>
              </form>
            </div>
          </div>

          {extractResult && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Extracted Entities</h3>
              </div>
              <div className="card-body">
                {extractResult.summary && (
                  <div style={{ background: '#F9FAFB', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '0.875rem' }}>Summary:</strong>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#374151' }}>{extractResult.summary}</p>
                  </div>
                )}

                {extractResult.entities && extractResult.entities.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                      Entities ({extractResult.entities.length})
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {extractResult.entities.map((entity, i) => (
                        <div
                          key={i}
                          title={entity.description || ''}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            padding: '0.375rem 0.75rem',
                            borderRadius: '9999px',
                            background: (entityTypeColors[entity.type] || '#6B7280') + '20',
                            border: `1px solid ${entityTypeColors[entity.type] || '#6B7280'}40`,
                            cursor: 'default'
                          }}
                        >
                          <span style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            background: entityTypeColors[entity.type] || '#6B7280',
                            flexShrink: 0
                          }} />
                          <span style={{ fontWeight: 500, fontSize: '0.875rem', color: '#1F2937' }}>{entity.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>{entity.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extractResult.relationships && extractResult.relationships.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#374151' }}>
                      Relationships ({extractResult.relationships.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {extractResult.relationships.map((rel, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', padding: '0.5rem', background: '#F9FAFB', borderRadius: '0.375rem' }}>
                          <span style={{ fontWeight: 600, color: '#1F2937' }}>{rel.source}</span>
                          <span style={{ color: '#9CA3AF' }}>→</span>
                          <span className="badge badge-gray">{rel.type}</span>
                          <span style={{ color: '#9CA3AF' }}>→</span>
                          <span style={{ fontWeight: 600, color: '#1F2937' }}>{rel.target}</span>
                          {rel.confidence_score != null && (
                            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#6B7280' }}>
                              {Math.round(rel.confidence_score * 100)}% confidence
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extractResult.key_topics && extractResult.key_topics.length > 0 && (
                  <div style={{ marginTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>Key Topics</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {extractResult.key_topics.map((topic, i) => (
                        <span key={i} className="tag">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query Graph Tab */}
      {activeTab === 'query' && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Query Knowledge Graph</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleQueryGraph}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Your Question
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ask a question about your knowledge graph..."
                    value={queryQuestion}
                    onChange={(e) => setQueryQuestion(e.target.value)}
                    required
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
                    Context (optional)
                  </label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Provide additional context from your knowledge base..."
                    value={queryContext}
                    onChange={(e) => setQueryContext(e.target.value)}
                    rows="4"
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={queryLoading || !queryQuestion.trim()}>
                  {queryLoading ? 'Querying...' : 'Query Graph'}
                </button>
              </form>
            </div>
          </div>

          {queryResult && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Answer</h3>
                {queryResult.confidence != null && (
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Confidence: {typeof queryResult.confidence === 'number'
                      ? `${Math.round(queryResult.confidence * 100)}%`
                      : queryResult.confidence}
                  </span>
                )}
              </div>
              <div className="card-body">
                {queryResult.answer && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                    <p style={{ color: '#166534', margin: 0 }}>{queryResult.answer}</p>
                  </div>
                )}

                {queryResult.sources && queryResult.sources.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sources</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#374151' }}>
                      {queryResult.sources.map((source, i) => (
                        <li key={i}>{typeof source === 'string' ? source : JSON.stringify(source)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {queryResult.reasoning_path && queryResult.reasoning_path.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Reasoning Path</h4>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#374151' }}>
                      {queryResult.reasoning_path.map((step, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {queryResult.related_questions && queryResult.related_questions.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Related Questions</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {queryResult.related_questions.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => { setQueryQuestion(q); setQueryResult(null); }}
                          style={{
                            textAlign: 'left',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #E5E7EB',
                            borderRadius: '0.375rem',
                            background: 'white',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            color: '#3B82F6'
                          }}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Find Connections Tab */}
      {activeTab === 'connections' && (
        <div>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Find Entity Connections</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleFindConnections}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Entity 1</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. React"
                      value={entity1}
                      onChange={(e) => setEntity1(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ paddingBottom: '0.25rem', fontSize: '1.5rem', textAlign: 'center', color: '#9CA3AF' }}>↔</div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>Entity 2</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. GraphQL"
                      value={entity2}
                      onChange={(e) => setEntity2(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={connectionsLoading || !entity1.trim() || !entity2.trim()}>
                  {connectionsLoading ? 'Searching...' : 'Find Connections'}
                </button>
              </form>
            </div>
          </div>

          {connectionsResult && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Connections between "{entity1}" and "{entity2}"</h3>
                {connectionsResult.strength_score != null && (
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    Strength: {Math.round((connectionsResult.strength_score || 0) * 100)}%
                  </span>
                )}
              </div>
              <div className="card-body">
                {connectionsResult.connections && connectionsResult.connections.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>Connections</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {connectionsResult.connections.map((conn, i) => (
                        <div key={i} style={{ padding: '0.75rem', background: '#F9FAFB', borderRadius: '0.5rem', border: '1px solid #E5E7EB' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: conn.description ? '0.25rem' : 0 }}>
                            <span className="badge badge-primary">{conn.type || 'connection'}</span>
                            {conn.strength && <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>Strength: {conn.strength}</span>}
                          </div>
                          {conn.description && <p style={{ margin: 0, fontSize: '0.875rem', color: '#374151' }}>{conn.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {connectionsResult.direct_connections && connectionsResult.direct_connections.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Direct Connections</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#374151' }}>
                      {connectionsResult.direct_connections.map((dc, i) => (
                        <li key={i} style={{ marginBottom: '0.25rem' }}>{typeof dc === 'string' ? dc : JSON.stringify(dc)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {connectionsResult.indirect_paths && connectionsResult.indirect_paths.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Indirect Paths</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {connectionsResult.indirect_paths.map((path, i) => (
                        <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '0.375rem', fontSize: '0.875rem', color: '#92400E' }}>
                          {typeof path === 'string' ? path : (path.path_description || JSON.stringify(path))}
                          {path.length && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#B45309' }}>(length: {path.length})</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {connectionsResult.common_topics && connectionsResult.common_topics.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Common Topics</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {connectionsResult.common_topics.map((topic, i) => (
                        <span key={i} className="tag">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}

                {connectionsResult.surprising_connections && (
                  <div style={{ background: '#FDF4FF', border: '1px solid #E9D5FF', borderRadius: '0.5rem', padding: '0.75rem' }}>
                    <strong style={{ fontSize: '0.875rem', color: '#7C3AED' }}>Surprising Connection:</strong>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#374151' }}>
                      {typeof connectionsResult.surprising_connections === 'string'
                        ? connectionsResult.surprising_connections
                        : JSON.stringify(connectionsResult.surprising_connections)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
