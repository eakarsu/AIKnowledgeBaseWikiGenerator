import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AIReport, { StructuredValue } from '../components/AIReport';

const AITools = () => {
  const [activeTool, setActiveTool] = useState(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [answerContext, setAnswerContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/ai/history');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch AI history:', error);
    }
  };

  const tools = [
    {
      id: 'generate',
      name: 'Content Generator',
      icon: '✨',
      description: 'Generate articles from topics',
      endpoint: '/ai/generate',
      inputLabel: 'Topic',
      aiTip: "I'll create a comprehensive article based on your topic. Try being specific for better results!",
      suggestions: [
        'Getting Started with React Hooks',
        'Best Practices for API Security',
        'How to Set Up CI/CD Pipeline',
        'Introduction to Machine Learning',
        'Docker Container Best Practices'
      ],
      placeholder: 'Enter a topic like "Getting Started with React Hooks" or "API Security Best Practices"'
    },
    {
      id: 'summarize',
      name: 'Summarizer',
      icon: '📝',
      description: 'Summarize long content',
      endpoint: '/ai/summarize',
      inputLabel: 'Content to summarize',
      aiTip: "Paste your long article or document, and I'll create a concise summary highlighting the key points!",
      suggestions: [
        'Paste a long article here...',
        'Copy content from a document...',
        'Enter meeting notes to summarize...'
      ],
      placeholder: 'Paste the content you want to summarize here. I work best with articles, documents, or lengthy text...',
      exampleContent: `React Hooks are a feature introduced in React 16.8 that allow you to use state and other React features without writing a class. They let you "hook into" React state and lifecycle features from function components. The most commonly used hooks are useState for managing state, useEffect for side effects, useContext for consuming context, useReducer for complex state logic, and useCallback/useMemo for performance optimization. Hooks solve many problems that developers faced with class components, including the difficulty of reusing stateful logic between components, complex components that are hard to understand, and confusing class syntax.`
    },
    {
      id: 'improve',
      name: 'Writing Improver',
      icon: '✏️',
      description: 'Improve writing quality',
      endpoint: '/ai/improve',
      inputLabel: 'Content to improve',
      aiTip: "I'll enhance your writing for clarity, grammar, and readability while keeping your message intact!",
      suggestions: [
        'Fix grammar and spelling',
        'Make it more professional',
        'Improve readability'
      ],
      placeholder: 'Enter your text here. I\'ll improve grammar, clarity, and overall writing quality...',
      exampleContent: `Their are many ways to improve you're writing. First, you should always proofread your work. Second, try to use active voice instead of passive. Also, dont use too many complicated words when simple ones will do. The most important thing is to get your point across clear and consise.`
    },
    {
      id: 'translate',
      name: 'Translator',
      icon: '🌐',
      description: 'Translate to other languages',
      endpoint: '/ai/translate',
      inputLabel: 'Content to translate',
      aiTip: "I'll translate your content while preserving the meaning, tone, and technical terms!",
      suggestions: [
        'Translate documentation',
        'Translate user guides',
        'Translate marketing content'
      ],
      placeholder: 'Enter content to translate. I\'ll preserve formatting and technical terminology...',
      exampleContent: `Welcome to our Knowledge Base! Here you'll find comprehensive documentation, tutorials, and guides to help you get started. Our platform offers powerful features for content management, team collaboration, and AI-powered assistance.`
    },
    {
      id: 'tags',
      name: 'Tag Generator',
      icon: '🏷️',
      description: 'Generate relevant tags',
      endpoint: '/ai/tags',
      inputLabel: 'Content for tag generation',
      aiTip: "I'll analyze your content and suggest relevant tags for better organization and discoverability!",
      suggestions: [
        'Analyze article for tags',
        'Generate SEO keywords',
        'Find relevant categories'
      ],
      placeholder: 'Paste your article or content here. I\'ll suggest relevant tags and keywords...',
      exampleContent: `This tutorial covers how to build a REST API using Node.js and Express. We'll implement authentication using JWT tokens, connect to a PostgreSQL database, and follow best practices for error handling and validation. By the end, you'll have a production-ready API.`
    },
    {
      id: 'title',
      name: 'Title Generator',
      icon: '📰',
      description: 'Generate compelling titles',
      endpoint: '/ai/title',
      inputLabel: 'Content for title generation',
      aiTip: "I'll create multiple engaging title options that capture the essence of your content!",
      suggestions: [
        'Generate blog post titles',
        'Create article headlines',
        'Write documentation titles'
      ],
      placeholder: 'Enter your content and I\'ll generate compelling title options...',
      exampleContent: `This guide walks you through setting up a development environment for building modern web applications. We cover installing Node.js, configuring VS Code, setting up Git, and creating your first project with React and TypeScript.`
    },
    {
      id: 'suggestions',
      name: 'Smart Suggestions',
      icon: '💡',
      description: 'Get improvement suggestions',
      endpoint: '/ai/suggestions',
      inputLabel: 'Content for suggestions',
      aiTip: "I'll analyze your content and provide actionable suggestions for clarity, SEO, structure, and more!",
      suggestions: [
        'Review article quality',
        'Get SEO recommendations',
        'Improve content structure'
      ],
      placeholder: 'Paste your content here for a comprehensive analysis and improvement suggestions...',
      exampleContent: `How to use our API. First you need to get an API key. Then you can make requests. The API returns JSON data. You can use any programming language to access it.`
    },
    {
      id: 'qa',
      name: 'Q&A Assistant',
      icon: '❓',
      description: 'Answer questions about content',
      endpoint: '/ai/answer',
      inputLabel: 'Your question',
      aiTip: "Ask me any question about your content or topic, and I'll provide a detailed, helpful answer!",
      suggestions: [
        'How do I implement authentication?',
        'What are the best practices for...?',
        'Can you explain how X works?',
        'What is the difference between A and B?'
      ],
      placeholder: 'Ask a question like "How do I implement user authentication?" or "What are best practices for API design?"'
    },
    {
      id: 'chat',
      name: 'Knowledge Chat',
      icon: '💬',
      description: 'Chat with your knowledge base',
      endpoint: '/ai/chat',
      inputLabel: 'Your question',
      aiTip: "I have access to all your knowledge base articles! Ask me anything about your documented content!",
      suggestions: [
        'What articles do we have about React?',
        'How do I get started with the platform?',
        'Find documentation about authentication',
        'What are our API endpoints?'
      ],
      placeholder: 'Ask about your knowledge base content, e.g., "What do our docs say about authentication?"'
    },
  ];

  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [contentType, setContentType] = useState('article');

  const presetExamples = [
    { label: 'Authentication guide', topic: 'Write a practical guide to API authentication for new developers, including setup, token rotation, common errors, and a short checklist.', content: 'Our API accepts bearer tokens in the Authorization header. Keys are scoped to a workspace and can be rotated in Settings. A 401 response means credentials are missing or invalid; a 403 response means the key lacks permission. Never place a secret key in browser code.', question: 'How should a new developer authenticate an API request and troubleshoot a 401 response?', language: 'Spanish', type: 'documentation' },
    { label: 'Release notes', topic: 'Draft release notes for a knowledge base update covering search filters, article ownership, and accessibility fixes.', content: 'The October release adds category and owner filters to search. Editors can now see an article ownership badge. Keyboard focus is visible in the article menu. Teams should review old saved searches because filter defaults may have changed.', question: 'What should editors check after the October knowledge base release?', language: 'French', type: 'article' },
    { label: 'Onboarding tutorial', topic: 'Create an onboarding tutorial for editors covering a first draft, review request, and publication.', content: 'To publish an article, create a draft, add a title and category, then request review from a teammate. Reviewers leave comments and approve the final text. After approval, an editor publishes the article and checks it in search.', question: 'What are the steps for drafting and publishing a reviewed article?', language: 'German', type: 'tutorial' }
  ];
  const applyPreset = (example) => {
    setInput(activeTool.id === 'generate' ? example.topic : ['qa', 'chat'].includes(activeTool.id) ? example.question : example.content);
    setAnswerContext(example.content);
    setTargetLanguage(example.language);
    setContentType(example.type);
  };

  const handleToolSelect = (tool) => {
    setActiveTool(tool);
    setResult('');
    setInput('');
    setAnswerContext('');
  };

  const handleSuggestionClick = (suggestion, index) => {
    applyPreset(presetExamples[index % presetExamples.length]);
    if (activeTool.id === 'generate') setInput(suggestion);
  };

  const handleUseExample = () => {
    applyPreset(presetExamples[0]);
    if (activeTool?.exampleContent) setInput(activeTool.exampleContent);
  };

  const handleSubmit = async () => {
    if (!input.trim() || !activeTool) return;

    setLoading(true);
    setResult('');

    try {
      let payload = {};
      let responseKey = '';

      switch (activeTool.id) {
        case 'generate':
          payload = { topic: input, type: contentType };
          responseKey = 'content';
          break;
        case 'summarize':
          payload = { content: input };
          responseKey = 'summary';
          break;
        case 'improve':
          payload = { content: input };
          responseKey = 'improved';
          break;
        case 'translate':
          payload = { content: input, target_language: targetLanguage };
          responseKey = 'translated';
          break;
        case 'tags':
          payload = { content: input };
          responseKey = 'tags';
          break;
        case 'title':
          payload = { content: input };
          responseKey = 'titles';
          break;
        case 'suggestions':
          payload = { content: input };
          responseKey = 'suggestions';
          break;
        case 'qa':
          payload = { question: input, context: answerContext };
          responseKey = 'answer';
          break;
        case 'chat':
          payload = { query: input };
          responseKey = 'answer';
          break;
        default:
          return;
      }

      const response = await api.post(activeTool.endpoint, payload);
      const data = response.data[responseKey];

      setResult(data);
    } catch (error) {
      setResult('Error: ' + (error.response?.data?.error || 'Failed to process request. Make sure your OpenRouter API key is configured.'));
    fetchHistory();
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'content_generation': '✨ Generated',
      'summarization': '📝 Summarized',
      'qa': '❓ Q&A',
      'translation': '🌐 Translated',
      'writing_improvement': '✏️ Improved'
    };
    return labels[type] || type;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Tools</h1>
          <p className="page-subtitle">Powerful AI features to enhance your content</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowHistory(true)}>
          📜 History ({history.length})
        </button>
      </div>

      <div className="ai-tools-grid">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`ai-tool-card ${activeTool?.id === tool.id ? 'active' : ''}`}
            onClick={() => handleToolSelect(tool)}
          >
            <div className="ai-tool-icon">{tool.icon}</div>
            <div className="ai-tool-title">{tool.name}</div>
            <div className="ai-tool-description">{tool.description}</div>
          </div>
        ))}
      </div>

      {activeTool && (
        <div className="ai-workspace">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">{activeTool.icon} {activeTool.name}</h3>
            </div>
            <div className="card-body">
              {/* AI Tip */}
              <div style={{
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🤖</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E40AF', marginBottom: '0.25rem' }}>AI Assistant</div>
                  <div style={{ color: '#3B82F6', fontSize: '0.875rem' }}>{activeTool.aiTip}</div>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="ai-preset-bar"><strong>Complete examples</strong><div className="ai-actions">{presetExamples.map((example) => <button key={example.label} type="button" className="btn btn-secondary" onClick={() => applyPreset(example)}>{example.label}</button>)}</div></div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Quick Suggestions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {activeTool.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion, index)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '9999px',
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        fontSize: '0.8125rem',
                        color: '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#F3F4F6';
                        e.target.style.borderColor = '#3B82F6';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = 'white';
                        e.target.style.borderColor = '#E5E7EB';
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool-specific options */}
              {activeTool.id === 'translate' && (
                <div className="form-group">
                  <label className="form-label">Target Language</label>
                  <select
                    className="form-input form-select"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    style={{ maxWidth: '200px' }}
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
                  </select>
                </div>
              )}

              {activeTool.id === 'generate' && (
                <div className="form-group">
                  <label className="form-label">Content Type</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['article', 'tutorial', 'faq', 'documentation'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContentType(type)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '0.5rem',
                          border: contentType === type ? '2px solid #3B82F6' : '1px solid #E5E7EB',
                          background: contentType === type ? '#EFF6FF' : 'white',
                          fontSize: '0.875rem',
                          color: contentType === type ? '#3B82F6' : '#374151',
                          cursor: 'pointer',
                          fontWeight: contentType === type ? 600 : 400,
                          textTransform: 'capitalize'
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              {activeTool.id === 'qa' && <div className="form-group"><label className="form-label" htmlFor="answer-context">Context (optional)</label><textarea id="answer-context" className="form-input form-textarea" value={answerContext} onChange={(event) => setAnswerContext(event.target.value)} rows="4" /></div>}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>{activeTool.inputLabel}</label>
                  {activeTool.exampleContent && (
                    <button
                      type="button"
                      onClick={handleUseExample}
                      className="btn btn-sm btn-secondary"
                    >
                      📋 Use Example
                    </button>
                  )}
                </div>
                <textarea
                  className="form-input form-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeTool.placeholder}
                  rows="6"
                  style={{ fontSize: '0.9375rem' }}
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={loading || !input.trim()}
                style={{ minWidth: '200px' }}
              >
                {loading ? (
                  <>⏳ Processing...</>
                ) : (
                  <>{activeTool.icon} Run {activeTool.name}</>
                )}
              </button>

              {result !== '' && <AIReport response={result} title={`${activeTool.name} result`} />}
            </div>
          </div>
        </div>
      )}

      {!activeTool && (
        <div className="card" style={{ marginTop: '2rem' }}>
          <div className="empty-state">
            <div className="empty-icon">🤖</div>
            <div className="empty-title">Select an AI Tool to Get Started</div>
            <div className="empty-text">Choose from the tools above to enhance your content with AI</div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal" style={{ maxWidth: '800px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📜 AI Generation History</h3>
              <button className="modal-close" onClick={() => setShowHistory(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflow: 'auto' }}>
              {history.length > 0 ? (
                <div>
                  {history.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #E5E7EB'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span className="badge badge-primary">{getTypeLabel(item.type)}</span>
                        <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Prompt:</strong>
                        <p style={{ fontSize: '0.875rem', color: '#374151', margin: '0.25rem 0' }}>
                          {item.prompt?.substring(0, 150)}{item.prompt?.length > 150 ? '...' : ''}
                        </p>
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Result:</strong>
                        <StructuredValue value={item.result} />
                      </div>
                      <button
                        className="btn btn-sm btn-secondary"
                        style={{ marginTop: '0.5rem' }}
                        onClick={() => {
                          setResult(item.result);
                          setShowHistory(false);
                        }}
                      >
                        Use This Result
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📜</div>
                  <div className="empty-title">No AI history yet</div>
                  <div className="empty-text">Your AI generations will appear here</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITools;
