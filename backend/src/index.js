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
app.use('/api/governed-knowledge-publishing', require('./governance'));

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
    if (process.env.AUTO_INIT_SCHEMA === 'true') await initializeDatabase();
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

// Generated prototype routes are opt-in for isolated, non-production evaluation.
if (process.env.ENABLE_GENERATED_ROUTES === 'true' && process.env.NODE_ENV !== 'production') {
app.use('/api/rag-qa', require('./routes/rag-qa'));
app.use('/api/kb-health-monitor', require('./routes/kb-health-monitor'));
app.use('/api/multi-language-kb', require('./routes/multi-language-kb'));
app.use('/api/slack-bot', require('./routes/slack-bot'));
app.use('/api/docs-widget', require('./routes/docs-widget'));

}
// Generated gap routes remain deliberately unmounted.
