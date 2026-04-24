const { pool } = require('../config/database');

const getDashboard = async (req, res) => {
  try {
    const [
      totalArticles,
      totalCategories,
      totalTags,
      totalUsers,
      recentArticles,
      topViewed,
      articlesByStatus,
      articlesByCategory
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM articles'),
      pool.query('SELECT COUNT(*) FROM categories'),
      pool.query('SELECT COUNT(*) FROM tags'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query(`
        SELECT a.id, a.title, a.views, a.status, a.created_at, u.name as author_name
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        ORDER BY a.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT a.id, a.title, a.views, c.name as category_name
        FROM articles a
        LEFT JOIN categories c ON a.category_id = c.id
        ORDER BY a.views DESC LIMIT 5
      `),
      pool.query(`
        SELECT status, COUNT(*) as count
        FROM articles
        GROUP BY status
      `),
      pool.query(`
        SELECT c.name, COUNT(a.id) as count
        FROM categories c
        LEFT JOIN articles a ON c.id = a.category_id
        GROUP BY c.id, c.name
        ORDER BY count DESC LIMIT 10
      `)
    ]);

    res.json({
      stats: {
        totalArticles: parseInt(totalArticles.rows[0].count),
        totalCategories: parseInt(totalCategories.rows[0].count),
        totalTags: parseInt(totalTags.rows[0].count),
        totalUsers: parseInt(totalUsers.rows[0].count)
      },
      recentArticles: recentArticles.rows,
      topViewed: topViewed.rows,
      articlesByStatus: articlesByStatus.rows,
      articlesByCategory: articlesByCategory.rows
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

const getArticleAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const [article, viewsOverTime, comments] = await Promise.all([
      pool.query('SELECT id, title, views, created_at FROM articles WHERE id = $1', [id]),
      pool.query(`
        SELECT DATE(created_at) as date, COUNT(*) as views
        FROM analytics
        WHERE article_id = $1 AND action = 'view'
        GROUP BY DATE(created_at)
        ORDER BY date DESC LIMIT 30
      `, [id]),
      pool.query('SELECT COUNT(*) FROM comments WHERE article_id = $1', [id])
    ]);

    if (article.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      article: article.rows[0],
      viewsOverTime: viewsOverTime.rows,
      totalComments: parseInt(comments.rows[0].count)
    });
  } catch (error) {
    console.error('Get article analytics error:', error);
    res.status(500).json({ error: 'Failed to get article analytics' });
  }
};

const trackEvent = async (req, res) => {
  try {
    const { article_id, action, metadata } = req.body;

    await pool.query(
      'INSERT INTO analytics (article_id, user_id, action, metadata) VALUES ($1, $2, $3, $4)',
      [article_id, req.user?.id, action, metadata]
    );

    res.json({ message: 'Event tracked' });
  } catch (error) {
    console.error('Track event error:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
};

module.exports = { getDashboard, getArticleAnalytics, trackEvent };
