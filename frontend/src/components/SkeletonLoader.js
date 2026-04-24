import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  borderRadius: '0.375rem'
};

export const SkeletonText = ({ width = '100%', height = '1rem', style = {} }) => (
  <div style={{ ...shimmerStyle, width, height, ...style }} />
);

export const SkeletonCard = ({ count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-body">
          <SkeletonText width="60%" height="1.25rem" style={{ marginBottom: '0.75rem' }} />
          <SkeletonText width="100%" height="0.875rem" style={{ marginBottom: '0.5rem' }} />
          <SkeletonText width="80%" height="0.875rem" style={{ marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <SkeletonText width="80px" height="1.5rem" />
            <SkeletonText width="60px" height="1.5rem" />
          </div>
        </div>
      </div>
    ))}
  </>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="card">
    <div className="card-body" style={{ padding: 0 }}>
      <table className="table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}><SkeletonText width="80px" height="0.75rem" /></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, ri) => (
            <tr key={ri} style={{ cursor: 'default' }}>
              {Array.from({ length: cols }).map((_, ci) => (
                <td key={ci}><SkeletonText width={ci === 0 ? '70%' : '50%'} height="0.875rem" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6, cols = 3 }) => (
  <div className={`grid grid-${cols}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card">
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ ...shimmerStyle, width: '3rem', height: '3rem', borderRadius: '0.75rem' }} />
            <div style={{ flex: 1 }}>
              <SkeletonText width="70%" height="1rem" style={{ marginBottom: '0.5rem' }} />
              <SkeletonText width="40%" height="0.75rem" />
            </div>
          </div>
          <SkeletonText width="100%" height="0.875rem" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonStats = ({ count = 4 }) => (
  <div className="stats-grid">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="stat-card" style={{ cursor: 'default' }}>
        <div style={{ ...shimmerStyle, width: '3rem', height: '3rem', borderRadius: '0.75rem', marginBottom: '1rem' }} />
        <SkeletonText width="60px" height="2rem" style={{ marginBottom: '0.5rem' }} />
        <SkeletonText width="100px" height="0.875rem" />
      </div>
    ))}
  </div>
);

export const SkeletonArticleList = ({ count = 5 }) => (
  <div className="article-list">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="article-item" style={{ cursor: 'default' }}>
        <div className="article-content">
          <SkeletonText width="70%" height="1.125rem" style={{ marginBottom: '0.5rem' }} />
          <SkeletonText width="100%" height="0.875rem" style={{ marginBottom: '0.25rem' }} />
          <SkeletonText width="85%" height="0.875rem" style={{ marginBottom: '0.75rem' }} />
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <SkeletonText width="80px" height="0.8rem" />
            <SkeletonText width="60px" height="0.8rem" />
            <SkeletonText width="50px" height="0.8rem" />
          </div>
        </div>
      </div>
    ))}
  </div>
);
