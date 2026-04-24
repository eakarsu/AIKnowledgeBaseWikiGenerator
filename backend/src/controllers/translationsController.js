const { pool } = require('../config/database');

const getByArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const result = await pool.query(
      'SELECT * FROM translations WHERE article_id = $1 ORDER BY language',
      [articleId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({ error: 'Failed to get translations' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM translations WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get translation error:', error);
    res.status(500).json({ error: 'Failed to get translation' });
  }
};

const create = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { language, title, content, translated_by = 'manual' } = req.body;

    if (!language || !content) {
      return res.status(400).json({ error: 'Language and content are required' });
    }

    const existing = await pool.query(
      'SELECT id FROM translations WHERE article_id = $1 AND language = $2',
      [articleId, language]
    );

    let result;
    if (existing.rows.length > 0) {
      result = await pool.query(
        'UPDATE translations SET title = $1, content = $2, translated_by = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [title, content, translated_by, existing.rows[0].id]
      );
    } else {
      result = await pool.query(
        'INSERT INTO translations (article_id, language, title, content, translated_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [articleId, language, title, content, translated_by]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create translation error:', error);
    res.status(500).json({ error: 'Failed to create translation' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM translations WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Translation not found' });
    }

    res.json({ message: 'Translation deleted' });
  } catch (error) {
    console.error('Delete translation error:', error);
    res.status(500).json({ error: 'Failed to delete translation' });
  }
};

module.exports = { getByArticle, getById, create, remove };
