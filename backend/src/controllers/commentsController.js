const { pool } = require('../config/database');

const getByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await pool.query(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.article_id = $1
      ORDER BY c.created_at ASC
    `, [articleId]);

    const buildTree = (comments, parentId = null) => {
      return comments
        .filter(c => c.parent_id === parentId)
        .map(c => ({ ...c, replies: buildTree(comments, c.id) }));
    };

    res.json(buildTree(result.rows));
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Failed to get comments' });
  }
};

const create = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { content, parent_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await pool.query(
      'INSERT INTO comments (content, article_id, user_id, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [content, articleId, req.user.id, parent_id]
    );

    const comment = await pool.query(`
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(comment.rows[0]);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const result = await pool.query(
      'UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [content, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};

module.exports = { getByArticle, create, update, remove };
