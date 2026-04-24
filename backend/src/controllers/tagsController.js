const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, COUNT(at.article_id) as article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      GROUP BY t.id
      ORDER BY article_count DESC, t.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ error: 'Failed to get tags' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tags WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const articles = await pool.query(`
      SELECT a.id, a.title, a.summary, a.status, a.views, a.created_at
      FROM articles a
      JOIN article_tags at ON a.id = at.article_id
      WHERE at.tag_id = $1
      ORDER BY a.updated_at DESC
    `, [id]);

    res.json({ ...result.rows[0], articles: articles.rows });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({ error: 'Failed to get tag' });
  }
};

const create = async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
      [name, color || '#6366f1']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Tag already exists' });
    }
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const result = await pool.query(
      'UPDATE tags SET name = COALESCE($1, name), color = COALESCE($2, color) WHERE id = $3 RETURNING *',
      [name, color, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove tag associations first (article_tags has ON DELETE CASCADE, but be explicit)
    await pool.query('DELETE FROM article_tags WHERE tag_id = $1', [id]);

    const result = await pool.query('DELETE FROM tags WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    await pool.query(`DELETE FROM article_tags WHERE tag_id IN (${placeholders})`, ids);
    const result = await pool.query(`DELETE FROM tags WHERE id IN (${placeholders}) RETURNING id`, ids);
    res.json({ message: `${result.rowCount} tags deleted`, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete tags error:', error);
    res.status(500).json({ error: 'Failed to bulk delete tags' });
  }
};

module.exports = { getAll, getById, create, update, remove, bulkDelete };
