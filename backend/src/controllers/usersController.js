const { pool } = require('../config/database');

const getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, email, name, role, avatar, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT id, email, name, role, avatar, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's articles count
    const articlesCount = await pool.query(
      'SELECT COUNT(*) FROM articles WHERE author_id = $1',
      [id]
    );

    // Get user's teams
    const teams = await pool.query(`
      SELECT t.id, t.name, tm.role
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = $1
    `, [id]);

    res.json({
      ...result.rows[0],
      articles_count: parseInt(articlesCount.rows[0].count),
      teams: teams.rows
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    // Only admins can update roles
    if (role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update roles' });
    }

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        role = COALESCE($2, role),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, name, role, avatar, created_at, updated_at`,
      [name, role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    // Prevent deleting yourself
    if (ids.includes(req.user.id)) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`DELETE FROM users WHERE id IN (${placeholders}) RETURNING id`, ids);
    res.json({ message: `${result.rowCount} users deleted`, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete users error:', error);
    res.status(500).json({ error: 'Failed to bulk delete users' });
  }
};

module.exports = { getAll, getById, update, remove, bulkDelete };
