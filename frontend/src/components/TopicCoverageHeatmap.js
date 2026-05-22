import React, { useEffect, useState } from 'react';
import api from '../services/api';

function colorFor(value) {
  // 0..100 -> light to deep indigo
  const t = Math.max(0, Math.min(100, value)) / 100;
  const r = Math.round(238 - t * 170);
  const g = Math.round(242 - t * 180);
  const b = Math.round(255 - t * 30);
  return `rgb(${r},${g},${b})`;
}

export default function TopicCoverageHeatmap() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get('/custom-views/topic-coverage-heatmap');
        if (!cancelled) setData(res.data);
      } catch (e) {
        if (!cancelled) setError(e.response?.data?.error || e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div style={{ padding: 16 }}>Loading topic coverage...</div>;
  if (error) return <div style={{ padding: 16, color: '#991b1b' }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div data-testid="topic-coverage-heatmap" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>Topic x Category Coverage</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 4, fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ padding: 6 }}></th>
              {data.categories.map((c) => (
                <th key={c} style={{ padding: '6px 10px', textAlign: 'center', color: '#374151', fontWeight: 600 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((row, ri) => (
              <tr key={data.topics[ri]}>
                <td style={{ padding: '6px 10px', fontWeight: 600, color: '#374151' }}>{data.topics[ri]}</td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    title={`${cell.topic} / ${cell.category}: ${cell.coverage}%`}
                    style={{
                      background: colorFor(cell.coverage),
                      color: cell.coverage > 55 ? '#fff' : '#111827',
                      padding: '12px 16px',
                      textAlign: 'center',
                      borderRadius: 4,
                      fontVariantNumeric: 'tabular-nums',
                      minWidth: 48,
                    }}
                  >
                    {cell.coverage}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#6b7280' }}>Cell values are coverage percentages (0–100).</div>
    </div>
  );
}
