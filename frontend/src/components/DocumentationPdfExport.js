import React, { useState } from 'react';
import api from '../services/api';

export default function DocumentationPdfExport() {
  const [title, setTitle] = useState('Knowledge Base Documentation Export');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get('/custom-views/documentation-export', { params: { title } });
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="documentation-pdf-export" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 12 }}>Documentation PDF Export</h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
        Generate a snapshot of the knowledge base as a downloadable PDF.
      </p>

      <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 6, marginBottom: 12 }}
      />

      <button
        onClick={generate}
        disabled={loading}
        style={{
          background: '#10b981', color: '#fff', border: 'none', padding: '10px 18px',
          borderRadius: 6, cursor: loading ? 'wait' : 'pointer', fontWeight: 600,
        }}
      >
        {loading ? 'Generating...' : 'Generate PDF'}
      </button>

      {error && (
        <div style={{ marginTop: 12, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ background: '#f3f4f6', borderRadius: 6, padding: 12, fontSize: 13 }}>
            Generated {result.pdf_bytes} bytes at {new Date(result.generated_at).toLocaleString()}.
          </div>
          <a
            href={result.pdf_data_url}
            download={`${(result.title || 'kb-export').replace(/\s+/g, '_')}.pdf`}
            style={{
              display: 'inline-block', marginTop: 12,
              background: '#3b82f6', color: '#fff', textDecoration: 'none',
              padding: '8px 14px', borderRadius: 6, fontWeight: 600, fontSize: 13,
            }}
          >
            Download PDF
          </a>
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Plain-text preview</summary>
            <pre style={{ background: '#f9fafb', padding: 12, borderRadius: 6, fontSize: 12, whiteSpace: 'pre-wrap' }}>
              {result.text}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
