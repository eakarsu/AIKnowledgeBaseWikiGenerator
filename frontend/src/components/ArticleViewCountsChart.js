import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ArticleViewCountsChart() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/custom-views/article-view-counts?limit=10');
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading article view counts...</div>;
  if (error) return <div style={{ padding: 16, color: '#991b1b' }}>Error: {error}</div>;
  if (!data) return null;

  const max = Math.max(...data.items.map(i => i.views), 1);

  return (
    <div data-testid="article-view-counts-chart" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Article View Counts</h3>
      <div style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Total views: {data.total_views}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.items.map((it) => (
          <div key={it.article_id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 200, fontSize: 13, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {it.title}
            </div>
            <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 22, position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${(it.views / max) * 100}%`,
                  background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
                  height: '100%',
                  borderRadius: 4,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <div style={{ width: 60, textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
              {it.views}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
