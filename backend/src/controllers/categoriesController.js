const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
             COUNT(DISTINCT a.id) as article_count,
             p.name as parent_name
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      LEFT JOIN categories p ON c.parent_id = p.id
      GROUP BY c.id, p.name
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT c.*,
             COUNT(DISTINCT a.id) as article_count,
             p.name as parent_name
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = $1
      GROUP BY c.id, p.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const articles = await pool.query(
      'SELECT id, title, summary, status, views, created_at FROM articles WHERE category_id = $1 ORDER BY updated_at DESC',
      [id]
    );

    res.json({ ...result.rows[0], articles: articles.rows });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, icon, color, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, description, icon, color, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, icon, color, parent_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, parent_id } = req.body;

    const result = await pool.query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        icon = COALESCE($3, icon),
        color = COALESCE($4, color),
        parent_id = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 RETURNING *`,
      [name, description, icon, color, parent_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has articles
    const articlesCheck = await pool.query(
      'SELECT COUNT(*) FROM articles WHERE category_id = $1',
      [id]
    );

    if (parseInt(articlesCheck.rows[0].count) > 0) {
      // Option: Set articles' category to NULL before deleting
      await pool.query('UPDATE articles SET category_id = NULL WHERE category_id = $1', [id]);
    }

    // Check if category has child categories
    await pool.query('UPDATE categories SET parent_id = NULL WHERE parent_id = $1', [id]);

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    await pool.query(`UPDATE articles SET category_id = NULL WHERE category_id IN (${placeholders})`, ids);
    await pool.query(`UPDATE categories SET parent_id = NULL WHERE parent_id IN (${placeholders})`, ids);
    const result = await pool.query(`DELETE FROM categories WHERE id IN (${placeholders}) RETURNING id`, ids);
    res.json({ message: `${result.rowCount} categories deleted`, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete categories error:', error);
    res.status(500).json({ error: 'Failed to bulk delete categories' });
  }
};

module.exports = { getAll, getById, create, update, remove, bulkDelete };
