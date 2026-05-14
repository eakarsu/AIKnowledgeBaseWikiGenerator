const { pool } = require('../config/database');
const https = require('https');

const getAll = async (req, res) => {
  try {
    const { article_id, suggestion_type, applied, limit = 50, offset = 0 } = req.query;
    let query = `
      SELECT ss.*, a.title as article_title
      FROM smart_suggestions ss
      LEFT JOIN articles a ON ss.article_id = a.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (article_id) {
      query += ` AND ss.article_id = $${paramIndex++}`;
      params.push(article_id);
    }
    if (suggestion_type) {
      query += ` AND ss.suggestion_type = $${paramIndex++}`;
      params.push(suggestion_type);
    }
    if (applied !== undefined) {
      query += ` AND ss.applied = $${paramIndex++}`;
      params.push(applied === 'true');
    }

    query += ` ORDER BY ss.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get smart suggestions error:', error);
    res.status(500).json({ error: 'Failed to get smart suggestions' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT ss.*, a.title as article_title
       FROM smart_suggestions ss
       LEFT JOIN articles a ON ss.article_id = a.id
       WHERE ss.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Smart suggestion not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get smart suggestion error:', error);
    res.status(500).json({ error: 'Failed to get smart suggestion' });
  }
};

const create = async (req, res) => {
  try {
    const { article_id, suggestion_type, suggestion } = req.body;
    if (!article_id || !suggestion) {
      return res.status(400).json({ error: 'article_id and suggestion are required' });
    }

    const result = await pool.query(
      'INSERT INTO smart_suggestions (article_id, suggestion_type, suggestion) VALUES ($1, $2, $3) RETURNING *',
      [article_id, suggestion_type || 'general', suggestion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create smart suggestion error:', error);
    res.status(500).json({ error: 'Failed to create smart suggestion' });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { suggestion_type, suggestion, applied } = req.body;

    const result = await pool.query(
      `UPDATE smart_suggestions SET
        suggestion_type = COALESCE($1, suggestion_type),
        suggestion = COALESCE($2, suggestion),
        applied = COALESCE($3, applied)
      WHERE id = $4 RETURNING *`,
      [suggestion_type, suggestion, applied, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Smart suggestion not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update smart suggestion error:', error);
    res.status(500).json({ error: 'Failed to update smart suggestion' });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM smart_suggestions WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Smart suggestion not found' });
    }
    res.json({ message: 'Smart suggestion deleted successfully' });
  } catch (error) {
    console.error('Delete smart suggestion error:', error);
    res.status(500).json({ error: 'Failed to delete smart suggestion' });
  }
};

// POST /api/smart-suggestions/auto-generate/:articleId
// Fetch article, extract entities via knowledge graph AI, find matching articles, create suggestions
const autoGenerate = async (req, res) => {
  try {
    const { articleId } = req.params;

    // Fetch the article
    const articleResult = await pool.query(
      'SELECT id, title, content FROM articles WHERE id = $1',
      [articleId]
    );
    if (articleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }
    const article = articleResult.rows[0];

    // Extract entities using knowledge graph AI (https, same pattern as knowledgeGraphAgents.js)
    const textToAnalyze = `${article.title}\n\n${(article.content || '').substring(0, 3000)}`;
    const entities = await extractEntities(textToAnalyze);

    if (!entities || !Array.isArray(entities.entities) || entities.entities.length === 0) {
      return res.json({ count: 0, message: 'No entities extracted from article' });
    }

    // Query existing articles matching entity names
    const entityNames = entities.entities.map(e => e.name).filter(Boolean);
    let suggestionsCreated = 0;

    for (const entityName of entityNames) {
      const matchingArticles = await pool.query(
        `SELECT id, title FROM articles WHERE id != $1 AND title ILIKE $2 LIMIT 5`,
        [articleId, `%${entityName}%`]
      );

      for (const matchedArticle of matchingArticles.rows) {
        // Avoid duplicate suggestions
        const existing = await pool.query(
          `SELECT id FROM smart_suggestions WHERE article_id = $1 AND suggestion ILIKE $2`,
          [articleId, `%${matchedArticle.id}%`]
        );
        if (existing.rows.length > 0) continue;

        await pool.query(
          `INSERT INTO smart_suggestions (article_id, suggestion_type, suggestion)
           VALUES ($1, $2, $3)`,
          [
            articleId,
            'related-article',
            `Related article: "${matchedArticle.title}" (id: ${matchedArticle.id}) — linked via entity "${entityName}"`
          ]
        );
        suggestionsCreated++;
      }
    }

    res.json({
      count: suggestionsCreated,
      entitiesExtracted: entityNames.length,
      message: `${suggestionsCreated} smart suggestion(s) created from ${entityNames.length} extracted entities`
    });
  } catch (error) {
    console.error('Auto-generate smart suggestions error:', error);
    res.status(500).json({ error: 'Failed to auto-generate smart suggestions' });
  }
};

// Helper: extract entities from text via OpenRouter
const extractEntities = (text) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'system',
          content: 'You are a knowledge graph entity extractor. Extract named entities and their relationships from text. Always return valid JSON with no markdown.'
        },
        {
          role: 'user',
          content: `Extract entities from this text. Return JSON with: entities (array with name, type [Person/Organization/Technology/Concept/Location/Event/Product]). Text: "${text.substring(0, 2000)}"`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Knowledge Base Wiki Generator'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.choices && response.choices[0]) {
            const content = response.choices[0].message.content;
            try {
              resolve(JSON.parse(content));
            } catch {
              resolve({ entities: [] });
            }
          } else {
            resolve({ entities: [] });
          }
        } catch (e) {
          resolve({ entities: [] });
        }
      });
    });

    req.on('error', () => resolve({ entities: [] }));
    req.write(data);
    req.end();
  });
};

module.exports = { getAll, getById, create, update, remove, autoGenerate };
