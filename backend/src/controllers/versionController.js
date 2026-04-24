const { pool } = require('../config/database');

const getByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await pool.query(`
      SELECT v.*, u.name as changed_by_name
      FROM version_history v
      LEFT JOIN users u ON v.changed_by = u.id
      WHERE v.article_id = $1
      ORDER BY v.version_number DESC
    `, [articleId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: 'Failed to get version history' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT v.*, u.name as changed_by_name
      FROM version_history v
      LEFT JOIN users u ON v.changed_by = u.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get version error:', error);
    res.status(500).json({ error: 'Failed to get version' });
  }
};

const restore = async (req, res) => {
  try {
    const { id } = req.params;
    const version = await pool.query('SELECT * FROM version_history WHERE id = $1', [id]);

    if (version.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const v = version.rows[0];

    const current = await pool.query('SELECT * FROM articles WHERE id = $1', [v.article_id]);
    if (current.rows.length > 0) {
      const versionCount = await pool.query(
        'SELECT COUNT(*) FROM version_history WHERE article_id = $1',
        [v.article_id]
      );
      await pool.query(
        'INSERT INTO version_history (article_id, title, content, changed_by, version_number, change_summary) VALUES ($1, $2, $3, $4, $5, $6)',
        [v.article_id, current.rows[0].title, current.rows[0].content, req.user.id, parseInt(versionCount.rows[0].count) + 1, 'Before restore']
      );
    }

    const result = await pool.query(
      'UPDATE articles SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [v.title, v.content, v.article_id]
    );

    res.json({ message: 'Version restored', article: result.rows[0] });
  } catch (error) {
    console.error('Restore version error:', error);
    res.status(500).json({ error: 'Failed to restore version' });
  }
};

const compare = async (req, res) => {
  try {
    const { id1, id2 } = req.params;

    const [version1, version2] = await Promise.all([
      pool.query('SELECT * FROM version_history WHERE id = $1', [id1]),
      pool.query('SELECT * FROM version_history WHERE id = $1', [id2])
    ]);

    if (version1.rows.length === 0 || version2.rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    res.json({
      version1: version1.rows[0],
      version2: version2.rows[0]
    });
  } catch (error) {
    console.error('Compare versions error:', error);
    res.status(500).json({ error: 'Failed to compare versions' });
  }
};

module.exports = { getByArticle, getById, restore, compare };
