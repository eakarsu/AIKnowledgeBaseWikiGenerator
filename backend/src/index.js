const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const routes = require('./routes');
const { initializeDatabase } = require('./config/database');
const { apiLimiter, aiLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
// CORS — supports comma-separated origins in FRONTEND_URL for multi-domain production deployments
const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api', apiLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', routes);
app.use('/api/knowledge-graph-agents', aiLimiter, require('./routes/knowledgeGraphAgents'));
app.use('/api/article-ownership-drift', require('./routes/article-ownership-drift'));

// Custom Views (mounted BEFORE 404 handler)
app.use('/api/custom-views', require('./routes/customViews'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const startServer = async () => {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/rag-qa', require('./routes/rag-qa'));
app.use('/api/kb-health-monitor', require('./routes/kb-health-monitor'));
app.use('/api/multi-language-kb', require('./routes/multi-language-kb'));
app.use('/api/slack-bot', require('./routes/slack-bot'));
app.use('/api/docs-widget', require('./routes/docs-widget'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_ai_answer_question = require('./routes/gap-ai-answer-question'); app.use('/api/gap-ai-answer-question', _gap_ai_answer_question); } catch(e) { console.error('gap mount fail ai-answer-question:', e.message); }
try { const _gap_ai_related_article_clustering = require('./routes/gap-ai-related-article-clustering'); app.use('/api/gap-ai-related-article-clustering', _gap_ai_related_article_clustering); } catch(e) { console.error('gap mount fail ai-related-article-clustering:', e.message); }
try { const _gap_ai_auto_toc_generator = require('./routes/gap-ai-auto-toc-generator'); app.use('/api/gap-ai-auto-toc-generator', _gap_ai_auto_toc_generator); } catch(e) { console.error('gap mount fail ai-auto-toc-generator:', e.message); }
try { const _gap_ai_broken_link_detection = require('./routes/gap-ai-broken-link-detection'); app.use('/api/gap-ai-broken-link-detection', _gap_ai_broken_link_detection); } catch(e) { console.error('gap mount fail ai-broken-link-detection:', e.message); }
try { const _gap_approval = require('./routes/gap-approval'); app.use('/api/gap-approval', _gap_approval); } catch(e) { console.error('gap mount fail approval:', e.message); }
try { const _gap_audience = require('./routes/gap-audience'); app.use('/api/gap-audience', _gap_audience); } catch(e) { console.error('gap mount fail audience:', e.message); }
try { const _gap_webhooks = require('./routes/gap-webhooks'); app.use('/api/gap-webhooks', _gap_webhooks); } catch(e) { console.error('gap mount fail webhooks:', e.message); }
try { const _gap_public = require('./routes/gap-public'); app.use('/api/gap-public', _gap_public); } catch(e) { console.error('gap mount fail public:', e.message); }
try { const _gap_e_signature = require('./routes/gap-e-signature'); app.use('/api/gap-e-signature', _gap_e_signature); } catch(e) { console.error('gap mount fail e-signature:', e.message); }
try { const _gap_mobile = require('./routes/gap-mobile'); app.use('/api/gap-mobile', _gap_mobile); } catch(e) { console.error('gap mount fail mobile:', e.message); }
// === End Batch 05 Mounts ===
