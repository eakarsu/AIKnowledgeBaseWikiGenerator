const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const { category } = req.query;
    let query = `
      SELECT t.*, u.name as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      query += ' AND t.category = $1';
      params.push(category);
    }

    query += ' ORDER BY t.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT t.*, u.name as created_by_name
      FROM templates t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
};

const create = async (req, res) => {
  try {
    const { name, description, content, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const result = await pool.query(
      'INSERT INTO templates (name, description, content, category, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, content, category, req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, content, category } = req.body;

    const result = await pool.query(
      `UPDATE templates SET
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        content = COALESCE($3, content),
        category = COALESCE($4, category),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5 RETURNING *`,
      [name, description, content, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM templates WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`DELETE FROM templates WHERE id IN (${placeholders}) RETURNING id`, ids);
    res.json({ message: `${result.rowCount} templates deleted`, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete templates error:', error);
    res.status(500).json({ error: 'Failed to bulk delete templates' });
  }
};

module.exports = { getAll, getById, create, update, remove, bulkDelete };
