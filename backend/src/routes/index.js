const express = require('express');
const router = express.Router();
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { authLimiter, aiLimiter } = require('../middleware/rateLimiter');
const { authorize } = require('../middleware/rbac');

// Controllers
const authController = require('../controllers/authController');
const articlesController = require('../controllers/articlesController');
const categoriesController = require('../controllers/categoriesController');
const tagsController = require('../controllers/tagsController');
const templatesController = require('../controllers/templatesController');
const teamsController = require('../controllers/teamsController');
const commentsController = require('../controllers/commentsController');
const bookmarksController = require('../controllers/bookmarksController');
const searchController = require('../controllers/searchController');
const analyticsController = require('../controllers/analyticsController');
const versionController = require('../controllers/versionController');
const notificationsController = require('../controllers/notificationsController');
const translationsController = require('../controllers/translationsController');
const aiController = require('../controllers/aiController');
const usersController = require('../controllers/usersController');
const aiFeaturesController = require('../controllers/aiFeaturesController');
const aiSuggestController = require('../controllers/aiSuggestController');
const smartSuggestionsController = require('../controllers/smartSuggestionsController');

// Auth routes
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/logout', authenticateToken, authController.logout);
router.post('/auth/forgot-password', authLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authLimiter, authController.resetPassword);
router.post('/auth/change-password', authenticateToken, authController.changePassword);
router.post('/auth/verify-email', authController.verifyEmail);
router.post('/auth/resend-verification', authenticateToken, authController.resendVerification);
router.get('/auth/profile', authenticateToken, authController.getProfile);
router.put('/auth/profile', authenticateToken, authController.updateProfile);

// Articles routes — bulk routes BEFORE :id routes
router.post('/articles/bulk-delete', authenticateToken, articlesController.bulkDelete);
router.put('/articles/bulk-update', authenticateToken, articlesController.bulkUpdate);
// Full-text search endpoint (PostgreSQL tsvector/ts_rank) — must be before /:id
router.get('/articles/search', optionalAuth, searchController.search);
router.get('/articles', optionalAuth, articlesController.getAll);
router.get('/articles/:id', optionalAuth, articlesController.getById);
router.post('/articles', authenticateToken, articlesController.create);
router.put('/articles/:id', authenticateToken, articlesController.update);
router.delete('/articles/:id', authenticateToken, articlesController.remove);
// Collaborative review workflow
router.put('/articles/:id/submit-for-review', authenticateToken, articlesController.submitForReview);

// Categories routes — bulk routes BEFORE :id routes
router.post('/categories/bulk-delete', authenticateToken, authorize('admin', 'editor'), categoriesController.bulkDelete);
router.get('/categories', categoriesController.getAll);
router.get('/categories/:id', categoriesController.getById);
router.post('/categories', authenticateToken, authorize('admin', 'editor'), categoriesController.create);
router.put('/categories/:id', authenticateToken, authorize('admin', 'editor'), categoriesController.update);
router.delete('/categories/:id', authenticateToken, authorize('admin', 'editor'), categoriesController.remove);

// Tags routes — bulk routes BEFORE :id routes
router.post('/tags/bulk-delete', authenticateToken, authorize('admin', 'editor'), tagsController.bulkDelete);
router.get('/tags', tagsController.getAll);
router.get('/tags/:id', tagsController.getById);
router.post('/tags', authenticateToken, authorize('admin', 'editor'), tagsController.create);
router.put('/tags/:id', authenticateToken, authorize('admin', 'editor'), tagsController.update);
router.delete('/tags/:id', authenticateToken, authorize('admin', 'editor'), tagsController.remove);

// Templates routes — bulk routes BEFORE :id routes
router.post('/templates/bulk-delete', authenticateToken, authorize('admin', 'editor'), templatesController.bulkDelete);
router.get('/templates', templatesController.getAll);
router.get('/templates/:id', templatesController.getById);
router.post('/templates', authenticateToken, authorize('admin', 'editor'), templatesController.create);
router.put('/templates/:id', authenticateToken, authorize('admin', 'editor'), templatesController.update);
router.delete('/templates/:id', authenticateToken, authorize('admin', 'editor'), templatesController.remove);

// Teams routes — bulk routes BEFORE :id routes
router.post('/teams/bulk-delete', authenticateToken, teamsController.bulkDelete);
router.get('/teams', authenticateToken, teamsController.getAll);
router.get('/teams/:id', authenticateToken, teamsController.getById);
router.post('/teams', authenticateToken, teamsController.create);
router.put('/teams/:id', authenticateToken, teamsController.update);
router.delete('/teams/:id', authenticateToken, teamsController.remove);
router.post('/teams/:id/members', authenticateToken, teamsController.addMember);
router.delete('/teams/:id/members/:userId', authenticateToken, teamsController.removeMember);

// Comments routes
router.get('/articles/:articleId/comments', commentsController.getByArticle);
router.post('/articles/:articleId/comments', authenticateToken, commentsController.create);
router.put('/comments/:id', authenticateToken, commentsController.update);
router.delete('/comments/:id', authenticateToken, commentsController.remove);

// Bookmarks routes
router.get('/bookmarks', authenticateToken, bookmarksController.getAll);
router.post('/bookmarks/:articleId', authenticateToken, bookmarksController.toggle);
router.get('/bookmarks/:articleId/check', authenticateToken, bookmarksController.check);

// Search routes
router.get('/search', optionalAuth, searchController.search);
router.get('/search/history', authenticateToken, searchController.getHistory);
router.delete('/search/history', authenticateToken, searchController.clearHistory);

// Analytics routes
router.get('/analytics/dashboard', authenticateToken, analyticsController.getDashboard);
router.get('/analytics/articles/:id', authenticateToken, analyticsController.getArticleAnalytics);
router.post('/analytics/track', optionalAuth, analyticsController.trackEvent);

// Version history routes
router.get('/articles/:articleId/versions', authenticateToken, versionController.getByArticle);
router.get('/versions/:id', authenticateToken, versionController.getById);
router.post('/versions/:id/restore', authenticateToken, versionController.restore);
router.get('/versions/compare/:id1/:id2', authenticateToken, versionController.compare);

// Notifications routes — bulk-delete BEFORE :id routes
router.post('/notifications/bulk-delete', authenticateToken, async (req, res) => {
  const { pool } = require('../config/database');
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const params = [...ids, req.user.id];
    const result = await pool.query(
      `DELETE FROM notifications WHERE id IN (${placeholders}) AND user_id = $${ids.length + 1} RETURNING id`,
      params
    );
    res.json({ message: `${result.rowCount} notifications deleted`, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete notifications error:', error);
    res.status(500).json({ error: 'Failed to bulk delete notifications' });
  }
});
router.get('/notifications', authenticateToken, notificationsController.getAll);
router.put('/notifications/:id/read', authenticateToken, notificationsController.markAsRead);
router.put('/notifications/read-all', authenticateToken, notificationsController.markAllAsRead);
router.delete('/notifications/:id', authenticateToken, notificationsController.remove);

// Translations routes
router.get('/articles/:articleId/translations', translationsController.getByArticle);
router.get('/translations/:id', translationsController.getById);
router.post('/articles/:articleId/translations', authenticateToken, translationsController.create);
router.delete('/translations/:id', authenticateToken, translationsController.remove);

// Users routes (admin) — bulk-delete BEFORE :id routes
router.post('/users/bulk-delete', authenticateToken, authorize('admin'), usersController.bulkDelete);
router.get('/users', authenticateToken, usersController.getAll);
router.get('/users/:id', authenticateToken, usersController.getById);
router.put('/users/:id', authenticateToken, usersController.update);
router.delete('/users/:id', authenticateToken, authorize('admin'), usersController.remove);

// Smart Suggestions routes — auto-generate BEFORE :id routes
router.post('/smart-suggestions/auto-generate/:articleId', authenticateToken, aiLimiter, smartSuggestionsController.autoGenerate);
router.get('/smart-suggestions', authenticateToken, smartSuggestionsController.getAll);
router.get('/smart-suggestions/:id', authenticateToken, smartSuggestionsController.getById);
router.post('/smart-suggestions', authenticateToken, smartSuggestionsController.create);
router.put('/smart-suggestions/:id', authenticateToken, smartSuggestionsController.update);
router.delete('/smart-suggestions/:id', authenticateToken, smartSuggestionsController.remove);

// AI routes
router.post('/ai/generate', authenticateToken, aiLimiter, aiController.generateContent);
// Streaming wiki generation via SSE
router.post('/ai/generate/stream', authenticateToken, aiLimiter, aiController.generateContentStream);
// AI-powered article suggestions based on KB gap analysis
router.post('/ai/suggest-articles', authenticateToken, aiLimiter, aiSuggestController.suggestArticles);
router.post('/ai/summarize', authenticateToken, aiLimiter, aiController.summarize);
router.post('/ai/answer', authenticateToken, aiLimiter, aiController.answerQuestion);
router.post('/ai/translate', authenticateToken, aiLimiter, aiController.translate);
router.post('/ai/suggestions', authenticateToken, aiLimiter, aiController.getSuggestions);
router.post('/ai/improve', authenticateToken, aiLimiter, aiController.improveWriting);
router.post('/ai/tags', authenticateToken, aiLimiter, aiController.generateTags);
router.post('/ai/title', authenticateToken, aiLimiter, aiController.generateTitle);
router.post('/ai/chat', authenticateToken, aiLimiter, aiController.chat);
router.get('/ai/history', authenticateToken, aiController.getHistory);
// Semantic duplicate detector
router.post('/ai/duplicate-check', authenticateToken, aiLimiter, aiController.duplicateCheck);

// AI Article Suggestions routes
router.get('/ai/article-suggestions', authenticateToken, aiFeaturesController.getArticleSuggestions);
router.get('/ai/article-suggestions/:id', authenticateToken, aiFeaturesController.getArticleSuggestionById);
router.post('/ai/article-suggestions', authenticateToken, aiLimiter, aiFeaturesController.createArticleSuggestion);
router.put('/ai/article-suggestions/:id', authenticateToken, aiFeaturesController.updateArticleSuggestion);
router.delete('/ai/article-suggestions/:id', authenticateToken, aiFeaturesController.deleteArticleSuggestion);

// AI API Documentation routes
router.get('/ai/api-docs', authenticateToken, aiFeaturesController.getApiDocumentations);
router.get('/ai/api-docs/:id', authenticateToken, aiFeaturesController.getApiDocumentationById);
router.post('/ai/api-docs', authenticateToken, aiLimiter, aiFeaturesController.createApiDocumentation);
router.put('/ai/api-docs/:id', authenticateToken, aiFeaturesController.updateApiDocumentation);
router.delete('/ai/api-docs/:id', authenticateToken, aiFeaturesController.deleteApiDocumentation);

// AI Search Optimization routes
router.get('/ai/search-optimize', authenticateToken, aiFeaturesController.getSearchOptimizations);
router.get('/ai/search-optimize/:id', authenticateToken, aiFeaturesController.getSearchOptimizationById);
router.post('/ai/search-optimize', authenticateToken, aiLimiter, aiFeaturesController.createSearchOptimization);
router.delete('/ai/search-optimize/:id', authenticateToken, aiFeaturesController.deleteSearchOptimization);

// AI Outdated Content routes
router.get('/ai/outdated-content', authenticateToken, aiFeaturesController.getOutdatedContent);
router.get('/ai/outdated-content/:id', authenticateToken, aiFeaturesController.getOutdatedContentById);
router.post('/ai/outdated-content', authenticateToken, aiLimiter, aiFeaturesController.createOutdatedContentCheck);
router.put('/ai/outdated-content/:id', authenticateToken, aiFeaturesController.updateOutdatedContent);
router.delete('/ai/outdated-content/:id', authenticateToken, aiFeaturesController.deleteOutdatedContent);

// AI FAQ routes
router.get('/ai/faqs', authenticateToken, aiFeaturesController.getFaqEntries);
router.get('/ai/faqs/:id', authenticateToken, aiFeaturesController.getFaqEntryById);
router.post('/ai/faqs', authenticateToken, aiLimiter, aiFeaturesController.createFaqEntry);
router.post('/ai/faqs/bulk', authenticateToken, aiLimiter, aiFeaturesController.generateBulkFaqs);
router.put('/ai/faqs/:id', authenticateToken, aiFeaturesController.updateFaqEntry);
router.delete('/ai/faqs/:id', authenticateToken, aiFeaturesController.deleteFaqEntry);

// AI Translation Engine routes
router.get('/ai/translations', authenticateToken, aiFeaturesController.getAiTranslations);
router.get('/ai/translations/:id', authenticateToken, aiFeaturesController.getAiTranslationById);
router.post('/ai/translations', authenticateToken, aiLimiter, aiFeaturesController.createAiTranslation);
router.delete('/ai/translations/:id', authenticateToken, aiFeaturesController.deleteAiTranslation);

module.exports = router;
