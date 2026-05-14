const { pool } = require('../config/database');
const aiService = require('../services/aiService');

// ── POST /api/ai/suggest-articles ─────────────────────────────────────────────
// Analyzes existing knowledge base content to identify topic gaps and suggest
// missing articles. The AI receives:
//   - All distinct categories
//   - All existing article titles (to know what already exists)
//   - The top 10 most-searched terms that have low result counts
//   - Tag frequency distribution (what topics are covered)
// It responds with a JSON array of suggested article topics.
const suggestArticles = async (req, res) => {
  try {
    // 1. Fetch all distinct categories
    const categoriesResult = await pool.query(
      'SELECT id, name, description FROM categories ORDER BY name'
    );

    // 2. Fetch all existing article titles grouped by category
    const articlesResult = await pool.query(`
      SELECT a.title, c.name AS category_name, a.status
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      ORDER BY c.name, a.title
      LIMIT 500
    `);

    // 3. Fetch frequently searched queries with low result counts (search gaps)
    const searchGapsResult = await pool.query(`
      SELECT query, COUNT(*) AS search_count, AVG(results_count) AS avg_results
      FROM search_history
      GROUP BY query
      HAVING AVG(results_count) < 3
      ORDER BY search_count DESC
      LIMIT 20
    `);

    // 4. Fetch tag frequency distribution (what's well covered)
    const tagsResult = await pool.query(`
      SELECT t.name, COUNT(at.article_id) AS article_count
      FROM tags t
      LEFT JOIN article_tags at ON t.id = at.tag_id
      GROUP BY t.name
      ORDER BY article_count DESC
      LIMIT 30
    `);

    // Build context strings
    const categoryNames = categoriesResult.rows.map(c => c.name).join(', ') || 'None yet';
    const existingTitles = articlesResult.rows.map(a => `"${a.title}" [${a.category_name || 'uncategorized'}]`).join('\n') || 'No articles yet';
    const searchGaps = searchGapsResult.rows.map(s => `"${s.query}" (searched ${s.search_count}x, avg ${parseFloat(s.avg_results).toFixed(1)} results)`).join('\n') || 'No search gap data';
    const tagCoverage = tagsResult.rows.map(t => `${t.name}: ${t.article_count} articles`).join(', ') || 'No tags yet';

    const messages = [
      {
        role: 'system',
        content: `You are a knowledge base strategist. You analyze existing KB content and identify gaps — topics users need but can't find. Return ONLY a valid JSON array with no markdown fences or prose outside the JSON.`
      },
      {
        role: 'user',
        content: `Analyze this knowledge base and suggest 8-12 missing articles that would fill important gaps.

EXISTING CATEGORIES: ${categoryNames}

EXISTING ARTICLES (${articlesResult.rows.length} total):
${existingTitles}

FREQUENTLY SEARCHED BUT UNDERSERVED QUERIES (low result counts — these are gaps):
${searchGaps}

TAG COVERAGE (topics already documented):
${tagCoverage}

Return a JSON array where each element has:
- "title": Specific, actionable article title (not vague)
- "category": Which existing category it belongs to, or suggest a new one
- "rationale": 1-2 sentences explaining why this article is missing and valuable
- "priority": "high" | "medium" | "low" based on search demand and gap severity
- "suggested_tags": Array of 3-5 relevant tags
- "estimated_length": "short" (< 500 words) | "medium" (500-1500 words) | "long" (> 1500 words)
- "target_audience": Who would read this article

Focus on gaps — do NOT suggest articles that already exist. Prioritize topics matching the search gap queries.`
      }
    ];

    const rawResult = await aiService.makeRequest(messages);

    // Parse the AI response
    let suggestions = [];
    try {
      // Try direct JSON parse
      suggestions = JSON.parse(rawResult);
    } catch {
      // Strip markdown fences if present
      const match = rawResult.match(/\[[\s\S]*\]/);
      if (match) {
        try {
          suggestions = JSON.parse(match[0]);
        } catch {
          suggestions = [];
        }
      }
    }

    // Persist each suggestion to article_suggestions table
    const savedSuggestions = [];
    for (const sug of suggestions) {
      const { rows } = await pool.query(
        `INSERT INTO article_suggestions
           (topic, title, summary, keywords, target_audience, difficulty, ai_response, status, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
         RETURNING *`,
        [
          sug.category || 'General',
          sug.title || '',
          sug.rationale || '',
          Array.isArray(sug.suggested_tags) ? sug.suggested_tags.join(', ') : '',
          sug.target_audience || '',
          sug.priority || 'medium',
          JSON.stringify(sug),
          req.user.id
        ]
      );
      savedSuggestions.push(rows[0]);
    }

    // Also log to ai_generations for history tracking
    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      [
        'article_suggestions',
        `KB gap analysis: ${articlesResult.rows.length} articles, ${searchGapsResult.rows.length} search gaps`,
        rawResult,
        process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
        req.user.id
      ]
    );

    res.json({
      suggestions,
      saved_count: savedSuggestions.length,
      context: {
        existing_articles: articlesResult.rows.length,
        categories: categoriesResult.rows.length,
        search_gaps_analyzed: searchGapsResult.rows.length,
      },
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Suggest articles error:', error);
    res.status(500).json({ error: 'Failed to generate article suggestions' });
  }
};

module.exports = { suggestArticles };
