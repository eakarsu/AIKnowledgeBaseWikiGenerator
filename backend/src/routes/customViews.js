// Custom Views routes
// Mounted at /api/custom-views
// 4 endpoints: article view counts (VIZ), topic-category coverage heatmap (VIZ),
//              documentation PDF export (NON-VIZ), content rules CRUD (NON-VIZ)
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// In-memory rules store (scaffold; persists for process lifetime)
const rulesStore = [
  {
    id: 1,
    name: 'Min-length policy',
    pattern: 'length>=400',
    severity: 'warn',
    template: 'documentation',
    description: 'Articles should be at least 400 characters.',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Tag required',
    pattern: 'tags>=1',
    severity: 'error',
    template: 'documentation',
    description: 'Every article must have at least one tag.',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    name: 'TOC for long articles',
    pattern: 'length>2000 && hasToc',
    severity: 'info',
    template: 'wiki',
    description: 'Long articles should include a table of contents.',
    created_at: new Date().toISOString(),
  },
];
let rulesNextId = 4;

// Deterministic pseudo-random for stable VIZ payloads
function seedRand(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// GET /api/custom-views/article-view-counts — VIZ 1
// Returns top-N article view counts for a bar chart.
router.get('/article-view-counts', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const sampleTitles = [
      'Getting Started Guide', 'API Reference', 'Authentication Overview',
      'Deployment Checklist', 'Troubleshooting FAQ', 'Glossary',
      'Architecture Notes', 'Release Notes', 'Best Practices', 'Migration Guide',
      'Security Policy', 'Onboarding', 'Contribution Guide', 'Performance Tuning',
      'Backup & Restore'
    ];
    const items = sampleTitles.slice(0, limit).map((title, i) => ({
      article_id: i + 1,
      title,
      views: Math.floor(120 + seedRand(i + 7) * 880),
    }));
    items.sort((a, b) => b.views - a.views);
    res.json({
      ok: true,
      kind: 'bar-chart',
      x_axis: 'title',
      y_axis: 'views',
      items,
      total_views: items.reduce((s, i) => s + i.views, 0),
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/custom-views/topic-coverage-heatmap — VIZ 2
// Returns topic x category coverage matrix for a heatmap visualization.
router.get('/topic-coverage-heatmap', authenticateToken, async (req, res) => {
  try {
    const topics = ['Auth', 'Search', 'Editor', 'Permissions', 'Notifications', 'Templates'];
    const categories = ['Guides', 'Tutorials', 'Reference', 'FAQ', 'Concepts'];
    const matrix = topics.map((topic, ti) =>
      categories.map((cat, ci) => ({
        topic,
        category: cat,
        coverage: Math.round(seedRand(ti * 11 + ci * 3 + 1) * 100),
      }))
    );
    res.json({
      ok: true,
      kind: 'heatmap',
      x_axis: 'category',
      y_axis: 'topic',
      topics,
      categories,
      matrix,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/custom-views/documentation-export — NON-VIZ 1
// Returns export metadata + a minimal PDF (data-URL) and plain text version.
router.get('/documentation-export', authenticateToken, async (req, res) => {
  try {
    const format = (req.query.format || 'pdf').toLowerCase();
    const title = req.query.title || 'Knowledge Base Documentation Export';
    const generatedAt = new Date().toISOString();
    const sections = [
      { heading: 'Introduction', body: 'This document is a generated documentation snapshot of the knowledge base.' },
      { heading: 'Articles', body: 'Top articles with view counts are included as appendix A.' },
      { heading: 'Topics', body: 'Topic coverage by category is included as appendix B.' },
      { heading: 'Rules', body: `Active content rules: ${rulesStore.length}.` },
    ];
    const text = `# ${title}\nGenerated: ${generatedAt}\n\n` +
      sections.map(s => `## ${s.heading}\n${s.body}\n`).join('\n');

    // Build a minimal valid PDF (single page, text only).
    const escapedTitle = title.replace(/[()\\]/g, m => '\\' + m);
    const pageText = `BT /F1 14 Tf 50 760 Td (${escapedTitle}) Tj ET ` +
      `BT /F1 10 Tf 50 740 Td (Generated: ${generatedAt}) Tj ET ` +
      sections.map((s, i) => `BT /F1 12 Tf 50 ${710 - i * 40} Td (${s.heading}: ${s.body.slice(0, 60).replace(/[()\\]/g, m => '\\' + m)}) Tj ET`).join(' ');
    const stream = pageText;
    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((obj, i) => {
      offsets.push(Buffer.byteLength(pdf));
      pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xrefStart = Buffer.byteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
    const pdfBase64 = Buffer.from(pdf, 'binary').toString('base64');

    if (format === 'raw-pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="kb-export.pdf"`);
      return res.send(Buffer.from(pdf, 'binary'));
    }

    res.json({
      ok: true,
      kind: 'documentation-export',
      title,
      format,
      generated_at: generatedAt,
      sections,
      text,
      pdf_data_url: `data:application/pdf;base64,${pdfBase64}`,
      pdf_bytes: pdf.length,
      download_hint: 'Append ?format=raw-pdf to download as binary attachment.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// /api/custom-views/content-rules — NON-VIZ 2 (CRUD)
router.get('/content-rules', authenticateToken, (req, res) => {
  res.json({ ok: true, items: rulesStore, total: rulesStore.length });
});

router.post('/content-rules', authenticateToken, (req, res) => {
  const { name, pattern, severity, template, description } = req.body || {};
  if (!name || !pattern) return res.status(400).json({ error: 'name and pattern are required' });
  const rule = {
    id: rulesNextId++,
    name: String(name),
    pattern: String(pattern),
    severity: ['info', 'warn', 'error'].includes(severity) ? severity : 'warn',
    template: template || 'documentation',
    description: description || '',
    created_at: new Date().toISOString(),
  };
  rulesStore.push(rule);
  res.status(201).json({ ok: true, rule });
});

router.put('/content-rules/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = rulesStore.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const { name, pattern, severity, template, description } = req.body || {};
  rulesStore[idx] = {
    ...rulesStore[idx],
    ...(name !== undefined ? { name: String(name) } : {}),
    ...(pattern !== undefined ? { pattern: String(pattern) } : {}),
    ...(severity !== undefined ? { severity } : {}),
    ...(template !== undefined ? { template } : {}),
    ...(description !== undefined ? { description } : {}),
    updated_at: new Date().toISOString(),
  };
  res.json({ ok: true, rule: rulesStore[idx] });
});

router.delete('/content-rules/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = rulesStore.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'rule not found' });
  const [removed] = rulesStore.splice(idx, 1);
  res.json({ ok: true, removed });
});

module.exports = router;
