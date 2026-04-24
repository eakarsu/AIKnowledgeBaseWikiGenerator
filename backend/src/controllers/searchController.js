const { pool } = require('../config/database');

const search = async (req, res) => {
  try {
    const { q, category, tags, status, limit = 20, offset = 0 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let query = `
      SELECT DISTINCT a.*, u.name as author_name, c.name as category_name,
             ts_rank(to_tsvector('english', a.title || ' ' || COALESCE(a.content, '')), plainto_tsquery('english', $1)) as rank
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE (a.title ILIKE $2 OR a.content ILIKE $2 OR a.summary ILIKE $2)
    `;
    const params = [q, `%${q}%`];
    let paramIndex = 3;

    if (category) {
      query += ` AND a.category_id = $${paramIndex++}`;
      params.push(category);
    }
    if (status) {
      query += ` AND a.status = $${paramIndex++}`;
      params.push(status);
    }
    if (tags) {
      const tagArray = tags.split(',');
      query += ` AND t.name = ANY($${paramIndex++})`;
      params.push(tagArray);
    }

    query += ` ORDER BY rank DESC, a.views DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    if (req.user) {
      await pool.query(
        'INSERT INTO search_history (query, user_id, results_count) VALUES ($1, $2, $3)',
        [q, req.user.id, result.rows.length]
      );
    }

    res.json({
      query: q,
      total: result.rows.length,
      results: result.rows
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

const getHistory = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM search_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ error: 'Failed to get search history' });
  }
};

const clearHistory = async (req, res) => {
  try {
    await pool.query('DELETE FROM search_history WHERE user_id = $1', [req.user.id]);
    res.json({ message: 'Search history cleared' });
  } catch (error) {
    console.error('Clear search history error:', error);
    res.status(500).json({ error: 'Failed to clear search history' });
  }
};

module.exports = { search, getHistory, clearHistory };
