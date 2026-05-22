const { pool } = require('../config/database');
const aiService = require('../services/aiService');

const getAll = async (req, res) => {
  try {
    const { category, status, search, sort, order } = req.query;
    // Pagination: support both page/limit and offset/limit for backward compat
    const page = parseInt(req.query.page) || null;
    const limit = parseInt(req.query.limit) || 50;
    const offset = page ? (page - 1) * limit : parseInt(req.query.offset) || 0;

    let countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE 1=1
    `;
    let query = `
      SELECT a.*, u.name as author_name, c.name as category_name,
             array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category) {
      const clause = ` AND a.category_id = $${paramIndex++}`;
      query += clause;
      countQuery += clause;
      params.push(category);
    }
    if (status) {
      const clause = ` AND a.status = $${paramIndex++}`;
      query += clause;
      countQuery += clause;
      params.push(status);
    }
    if (search) {
      const clause = ` AND (a.title ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex})`;
      query += clause;
      countQuery += clause;
      params.push(`%${search}%`);
      paramIndex++;
    }

    const allowedSorts = ['title', 'created_at', 'updated_at', 'views', 'status'];
    const sortColumn = allowedSorts.includes(sort) ? `a.${sort}` : 'a.updated_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    query += ` GROUP BY a.id, u.name, c.name ORDER BY ${sortColumn} ${sortOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, params.length - 2)) // count uses same filters but no limit/offset
    ]);

    const total = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(total / limit);
    const currentPage = page || Math.floor(offset / limit) + 1;

    // Return paginated response when page param used, otherwise plain array for backward compat
    if (req.query.page) {
      res.json({
        data: result.rows,
        pagination: {
          page: currentPage,
          limit,
          total,
          totalPages
        }
      });
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ error: 'Failed to get articles' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('UPDATE articles SET views = views + 1 WHERE id = $1', [id]);

    const result = await pool.query(`
      SELECT a.*, u.name as author_name, u.email as author_email, c.name as category_name,
             array_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color))
             FILTER (WHERE t.id IS NOT NULL) as tags
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.id = $1
      GROUP BY a.id, u.name, u.email, c.name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ error: 'Failed to get article' });
  }
};

const create = async (req, res) => {
  try {
    const { title, content, summary, status = 'draft', category_id, tags } = req.body;
    const author_id = req.user.id;

    const result = await pool.query(
      'INSERT INTO articles (title, content, summary, status, author_id, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, content, summary, status, author_id, category_id]
    );

    const article = result.rows[0];

    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await pool.query(
          'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [article.id, tagId]
        );
      }
    }

    res.status(201).json(article);
  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ error: 'Failed to create article' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, status, category_id, tags } = req.body;

    // Save version history
    const oldArticle = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (oldArticle.rows.length > 0) {
      const versionCount = await pool.query(
        'SELECT COUNT(*) FROM version_history WHERE article_id = $1',
        [id]
      );
      await pool.query(
        'INSERT INTO version_history (article_id, title, content, changed_by, version_number) VALUES ($1, $2, $3, $4, $5)',
        [id, oldArticle.rows[0].title, oldArticle.rows[0].content, req.user.id, parseInt(versionCount.rows[0].count) + 1]
      );
    }

    const result = await pool.query(
      `UPDATE articles SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        summary = COALESCE($3, summary),
        status = COALESCE($4, status),
        category_id = COALESCE($5, category_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 RETURNING *`,
      [title, content, summary, status, category_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (tags) {
      await pool.query('DELETE FROM article_tags WHERE article_id = $1', [id]);
      for (const tagId of tags) {
        await pool.query(
          'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tagId]
        );
      }
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ error: 'Failed to update article' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ error: 'Failed to delete article' });
  }
};

const bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(`DELETE FROM articles WHERE id IN (${placeholders}) RETURNING id`, ids);
    res.json({ message: `${result.rowCount} articles deleted`, deleted: result.rowCount });
  } catch (error) {
    console.error('Bulk delete articles error:', error);
    res.status(500).json({ error: 'Failed to bulk delete articles' });
  }
};

const bulkUpdate = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Array of IDs is required' });
    }
    const { status, category_id } = updates || {};
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    let paramIndex = ids.length + 1;
    let setClauses = ['updated_at = CURRENT_TIMESTAMP'];
    const params = [...ids];

    if (status) {
      setClauses.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (category_id) {
      setClauses.push(`category_id = $${paramIndex++}`);
      params.push(category_id);
    }

    const result = await pool.query(
      `UPDATE articles SET ${setClauses.join(', ')} WHERE id IN (${placeholders}) RETURNING id`,
      params
    );
    res.json({ message: `${result.rowCount} articles updated`, updated: result.rowCount });
  } catch (error) {
    console.error('Bulk update articles error:', error);
    res.status(500).json({ error: 'Failed to bulk update articles' });
  }
};

// PUT /api/articles/:id/submit-for-review
// Updates article status to 'in-review', fire-and-forget AI suggestions as a system comment
const submitForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE articles SET status = 'in-review', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const article = result.rows[0];

    // Fire-and-forget: generate AI suggestions and post as system comment
    if (article.content) {
      (async () => {
        try {
          const suggestionsText = await aiService.generateSuggestions(article.content);
          let suggestions = [];
          try {
            const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
            suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
          } catch {
            suggestions = [];
          }

          const commentContent = `[AI Review] Automated suggestions for "${article.title}":\n\n${
            suggestions.map((s, i) =>
              `${i + 1}. [${s.type || 'general'} / ${s.priority || 'medium'} priority] ${s.suggestion}`
            ).join('\n')
          }`;

          await pool.query(
            `INSERT INTO comments (content, article_id, user_id) VALUES ($1, $2, NULL)`,
            [commentContent, id]
          );
        } catch (err) {
          console.error('AI review comment error:', err.message);
        }
      })();
    }

    res.json(article);
  } catch (error) {
    console.error('Submit for review error:', error);
    res.status(500).json({ error: 'Failed to submit article for review' });
  }
};

module.exports = { getAll, getById, create, update, remove, bulkDelete, bulkUpdate, submitForReview };
