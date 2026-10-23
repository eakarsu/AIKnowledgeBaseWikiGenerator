'use strict';
// FP38A pure helpers: tasks validation, main-list search/filter, CSV/JSON
// export, and domain AI with a labelled deterministic fallback.
// Provider is used only when OPENROUTER_API_KEY or OPENAI_API_KEY is set;
// otherwise every AI result is aiGenerated:false with readable sections
// that preserve false / 0 / '' values from the source record.
const COLUMNS = ['id','title','status','category_id','views','created_at'];
function validateTask(input = {}) {
  const title = String(input.title || '').trim();
  if (!title) throw new Error('title is required');
  const status = ['open','in_progress','done'].includes(input.status) ? input.status : 'open';
  return { title, status, assignee: input.assignee ?? null, notes: input.notes ?? '', due_date: input.due_date ?? null };
}
function filterRecords(records, filters = {}) {
  const list = Array.isArray(records) ? records : [];
  const q = String(filters.search || filters.q || '').trim().toLowerCase();
  const status = String(filters.status || '').trim().toLowerCase();
  return list.filter((r) => {
    if (status && String(r.status ?? '').toLowerCase() !== status) return false;
    if (q && !Object.values(r || {}).join(' ').toLowerCase().includes(q)) return false;
    return true;
  });
}
function csvEscape(v) { if (v === null || v === undefined) return ''; const s = String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s; }
function toCsv(records, columns = COLUMNS) { const list = Array.isArray(records) ? records : []; return [columns.join(','), ...list.map((r) => columns.map((c) => csvEscape(r ? r[c] : '')).join(','))].join('\n'); }
function toJsonExport(records) { return { exported_at: new Date().toISOString(), count: (records || []).length, data: records || [] }; }
function fallback(feature, sections) { return { feature, aiGenerated: false, source: 'deterministic-fallback', label: 'Deterministic fallback — no AI provider key configured', sections }; }
function hasProviderKey() { return Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY); }
async function withProvider(feature, sections, prompt) {
  const base = fallback(feature, sections);
  if (!hasProviderKey()) return base;
  try {
    const isOR = Boolean(process.env.OPENROUTER_API_KEY);
    const url = isOR ? 'https://openrouter.ai/api/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const key = isOR ? process.env.OPENROUTER_API_KEY : process.env.OPENAI_API_KEY;
    const model = process.env.OPENROUTER_MODEL || process.env.OPENAI_MODEL || (isOR ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');
    const resp = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] }) });
    if (!resp.ok) return base;
    const data = await resp.json();
    const narrative = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
    if (!narrative) return base;
    return { ...base, aiGenerated: true, source: isOR ? 'openrouter' : 'openai', label: 'AI-generated', narrative };
  } catch { return base; }
}

function words(t){ return String(t||'').trim() ? String(t).trim().split(/\s+/).length : 0; }
function articleSummary(a = {}) { const w = words(a.content); return fallback('article-summary', { title: a.title ?? '', status: a.status ?? '', word_count: w, reading_time_minutes: Math.ceil(w/200), has_summary: Boolean(a.summary), is_empty: w === 0 }); }
function tagSuggestions(a = {}) { const stop = new Set(['the','a','an','and','or','of','to','in','is','for']); const freq={}; for(const w of String(a.content||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/)){ if(w.length>3 && !stop.has(w)) freq[w]=(freq[w]||0)+1; } const tags = Object.entries(freq).sort((x,y)=>y[1]-x[1]).slice(0,5).map(([t])=>t); return fallback('tag-suggestions', { title: a.title ?? '', suggested_tags: tags, tag_count: tags.length }); }
function relatedArticles(a = {}, all = []) { const mine = new Set(String(a.title||'').toLowerCase().split(/\s+/)); const rel = (Array.isArray(all)?all:[]).filter((o)=>o!==a).map((o)=>({ title:o.title ?? '', shared_words: String(o.title||'').toLowerCase().split(/\s+/).filter((w)=>mine.has(w)).length })).filter((x)=>x.shared_words>0).sort((x,y)=>y.shared_words-x.shared_words).slice(0,5); return fallback('related-articles', { title: a.title ?? '', related: rel, related_count: rel.length }); }

module.exports = { COLUMNS, validateTask, filterRecords, toCsv, toJsonExport, fallback, hasProviderKey, withProvider, articleSummary, tagSuggestions, relatedArticles };
