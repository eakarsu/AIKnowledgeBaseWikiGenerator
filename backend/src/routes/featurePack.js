'use strict';
// FP38A authenticated tasks + search/filter + CSV/JSON export + domain AI.
// Tasks are held in-process (no DB migration). Main-list records are read
// through the injected getRecords() so tests can run without a database.
const express = require('express');
const fp = require('../services/featurePack');
function createFeaturePackRouter({ authenticate, getRecords, aiHandlers } = {}) {
  const router = express.Router();
  if (authenticate) router.use(authenticate);
  const tasks = []; let seq = 1;
  router.get('/tasks', (req, res) => { const data = fp.filterRecords(tasks, req.query); res.json({ data, count: data.length }); });
  router.post('/tasks', (req, res) => { try { const t = fp.validateTask(req.body || {}); const task = { id: seq++, ...t, created_by: req.user?.id ?? req.user?.userId ?? null, created_at: new Date().toISOString() }; tasks.push(task); res.status(201).json(task); } catch (e) { res.status(400).json({ error: e.message }); } });
  router.put('/tasks/:id', (req, res) => { const task = tasks.find((t) => String(t.id) === String(req.params.id)); if (!task) return res.status(404).json({ error: 'Task not found' }); const b = req.body || {}; if (b.title !== undefined) task.title = String(b.title).trim(); if (b.status !== undefined) task.status = ['open','in_progress','done'].includes(b.status) ? b.status : task.status; if (b.assignee !== undefined) task.assignee = b.assignee; if (b.notes !== undefined) task.notes = b.notes; if (b.due_date !== undefined) task.due_date = b.due_date; task.updated_at = new Date().toISOString(); res.json(task); });
  router.get('/search', async (req, res) => { try { const rows = getRecords ? await getRecords(req) : []; const data = fp.filterRecords(rows, req.query); res.json({ data, count: data.length }); } catch (e) { res.status(500).json({ error: e.message }); } });
  router.get('/export', async (req, res) => { try { const rows = getRecords ? await getRecords(req) : []; const data = fp.filterRecords(rows, req.query); if (String(req.query.format || 'csv').toLowerCase() === 'json') return res.json(fp.toJsonExport(data)); res.setHeader('Content-Type', 'text/csv'); res.setHeader('Content-Disposition', 'attachment; filename="export.csv"'); res.send(fp.toCsv(data)); } catch (e) { res.status(500).json({ error: e.message }); } });
  const handlers = aiHandlers || {};
  for (const [name, fn] of Object.entries(handlers)) {
    router.post('/ai/' + name, async (req, res) => { try { const records = req.body && req.body.records ? req.body.records : (getRecords ? await getRecords(req) : []); const record = (req.body && req.body.record) || (Array.isArray(records) ? records[0] : null) || {}; const fb = fn(record, Array.isArray(records) ? records : []); const out = await fp.withProvider(name, fb.sections, 'Analyse: ' + JSON.stringify({ record, records }).slice(0, 4000)); res.json(out); } catch (e) { res.status(500).json({ error: e.message }); } });
  }
  router.tasks = tasks;
  return router;
}
module.exports = { createFeaturePackRouter };
