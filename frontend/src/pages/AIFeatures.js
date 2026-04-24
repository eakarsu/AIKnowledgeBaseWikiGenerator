import React from 'react';
import { useNavigate } from 'react-router-dom';

const AIFeatures = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'article-suggester',
      name: 'AI Article Suggester',
      icon: '💡',
      description: 'Get AI-powered suggestions for new articles based on topics and trends',
      color: '#3B82F6',
      path: '/ai-features/article-suggester'
    },
    {
      id: 'api-documentation',
      name: 'AI API Documentation',
      icon: '📋',
      description: 'Generate comprehensive API documentation for DevOps workflows',
      color: '#10B981',
      path: '/ai-features/api-documentation'
    },
    {
      id: 'search-optimizer',
      name: 'AI Search Optimizer',
      icon: '🔍',
      description: 'Optimize search queries for better results and discoverability',
      color: '#8B5CF6',
      path: '/ai-features/search-optimizer'
    },
    {
      id: 'outdated-content',
      name: 'AI Outdated Content Detector',
      icon: '⏰',
      description: 'Detect and flag outdated content that needs updating',
      color: '#F59E0B',
      path: '/ai-features/outdated-content'
    },
    {
      id: 'translation-engine',
      name: 'AI Translation Engine',
      icon: '🌐',
      description: 'Advanced AI-powered translation with context awareness',
      color: '#EC4899',
      path: '/ai-features/translation-engine'
    },
    {
      id: 'faq-generator',
      name: 'AI FAQ Generator',
      icon: '❓',
      description: 'Automatically generate FAQs from topics and content',
      color: '#06B6D4',
      path: '/ai-features/faq-generator'
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Features</h1>
          <p className="page-subtitle">Powerful AI-powered tools to enhance your knowledge base</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/ai-tools')}>
          🤖 Classic AI Tools
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1.5rem',
        marginTop: '2rem'
      }}>
        {features.map((feature) => (
          <div
            key={feature.id}
            onClick={() => navigate(feature.path)}
            style={{
              background: 'white',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              border: '2px solid transparent',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = feature.color;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100px',
              height: '100px',
              background: `linear-gradient(135deg, ${feature.color}20 0%, transparent 60%)`,
              borderRadius: '0 1rem 0 100%'
            }} />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '1rem',
              background: `${feature.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              marginBottom: '1rem'
            }}>
              {feature.icon}
            </div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#1F2937',
              marginBottom: '0.5rem'
            }}>
              {feature.name}
            </h3>
            <p style={{
              color: '#6B7280',
              fontSize: '0.9375rem',
              lineHeight: 1.5,
              marginBottom: '1rem'
            }}>
              {feature.description}
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              color: feature.color,
              fontWeight: 500,
              fontSize: '0.875rem'
            }}>
              Open Feature
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginLeft: '0.5rem' }}>
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Quick Stats</h3>
        </div>
        <div className="card-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '1rem'
          }}>
            {features.map((feature) => (
              <div
                key={feature.id}
                style={{
                  textAlign: 'center',
                  padding: '1rem',
                  background: `${feature.color}08`,
                  borderRadius: '0.75rem'
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{feature.icon}</div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>{feature.name.replace('AI ', '')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeatures;
