const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.*, a.title, a.summary, a.status, a.views, a.created_at as article_created_at,
             c.name as category_name
      FROM bookmarks b
      JOIN articles a ON b.article_id = a.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ error: 'Failed to get bookmarks' });
  }
};

const toggle = async (req, res) => {
  try {
    const { articleId } = req.params;

    const existing = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND article_id = $2',
      [req.user.id, articleId]
    );

    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM bookmarks WHERE id = $1', [existing.rows[0].id]);
      res.json({ bookmarked: false, message: 'Bookmark removed' });
    } else {
      await pool.query(
        'INSERT INTO bookmarks (user_id, article_id) VALUES ($1, $2)',
        [req.user.id, articleId]
      );
      res.json({ bookmarked: true, message: 'Bookmark added' });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    res.status(500).json({ error: 'Failed to toggle bookmark' });
  }
};

const check = async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND article_id = $2',
      [req.user.id, articleId]
    );

    res.json({ bookmarked: result.rows.length > 0 });
  } catch (error) {
    console.error('Check bookmark error:', error);
    res.status(500).json({ error: 'Failed to check bookmark' });
  }
};

module.exports = { getAll, toggle, check };
