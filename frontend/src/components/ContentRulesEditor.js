import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

const TEMPLATES = ['documentation', 'wiki', 'api-reference', 'faq'];
const SEVERITIES = ['info', 'warn', 'error'];

const blankForm = { name: '', pattern: '', severity: 'warn', template: 'documentation', description: '' };

export default function ContentRulesEditor() {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/custom-views/content-rules');
      setRules(res.data.items || []);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        await api.put(`/custom-views/content-rules/${editingId}`, form);
      } else {
        await api.post('/custom-views/content-rules', form);
      }
      setForm(blankForm);
      setEditingId(null);
      await load();
    } catch (e2) {
      setError(e2.response?.data?.error || e2.message);
    }
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      name: r.name || '',
      pattern: r.pattern || '',
      severity: r.severity || 'warn',
      template: r.template || 'documentation',
      description: r.description || '',
    });
  };

  const remove = async (id) => {
    setError(null);
    try {
      await api.delete(`/custom-views/content-rules/${id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  return (
    <div data-testid="content-rules-editor" style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 20 }}>
      <h3 style={{ marginTop: 0, marginBottom: 4 }}>Content Rules Editor</h3>
      <p style={{ color: '#6b7280', fontSize: 13, marginTop: 0 }}>
        Manage validation rules applied to content templates.
      </p>

      <form onSubmit={submit} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
        <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            type="text" placeholder="Rule name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} required
            style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
          />
          <input
            type="text" placeholder="Pattern (e.g. length>=400)" value={form.pattern}
            onChange={(e) => setForm({ ...form, pattern: e.target.value })} required
            style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
          />
        </div>
        <select
          value={form.severity}
          onChange={(e) => setForm({ ...form, severity: e.target.value })}
          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={form.template}
          onChange={(e) => setForm({ ...form, template: e.target.value })}
          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6 }}
        >
          {TEMPLATES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <textarea
          placeholder="Description (optional)" value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          style={{ gridColumn: '1 / -1', padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'inherit' }}
        />
        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
          <button
            type="submit"
            style={{
              background: '#6366f1', color: '#fff', border: 'none', padding: '8px 16px',
              borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            {editingId ? 'Update rule' : 'Add rule'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => { setEditingId(null); setForm(blankForm); }}
              style={{
                background: '#fff', color: '#374151', border: '1px solid #d1d5db',
                padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && (
        <div style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: 10, borderRadius: 6, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div>Loading rules...</div>
      ) : rules.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No rules defined yet.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
              <th style={{ padding: 8 }}>Name</th>
              <th style={{ padding: 8 }}>Pattern</th>
              <th style={{ padding: 8 }}>Severity</th>
              <th style={{ padding: 8 }}>Template</th>
              <th style={{ padding: 8 }}></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                <td style={{ padding: 8, fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: 8, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{r.pattern}</td>
                <td style={{ padding: 8 }}>
                  <span style={{
                    background: r.severity === 'error' ? '#fee2e2' : r.severity === 'warn' ? '#fef3c7' : '#dbeafe',
                    color: r.severity === 'error' ? '#991b1b' : r.severity === 'warn' ? '#92400e' : '#1e40af',
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                  }}>{r.severity}</span>
                </td>
                <td style={{ padding: 8 }}>{r.template}</td>
                <td style={{ padding: 8, textAlign: 'right' }}>
                  <button
                    onClick={() => startEdit(r)}
                    style={{ background: 'none', border: '1px solid #d1d5db', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12, marginRight: 6 }}
                  >Edit</button>
                  <button
                    onClick={() => remove(r.id)}
                    style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
