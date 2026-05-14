const { pool } = require('../config/database');
const aiService = require('../services/aiService');

const generateContent = async (req, res) => {
  try {
    const { topic, type = 'article' } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const result = await aiService.generateContent(topic, type);

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['content_generation', topic, result, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id]
    );

    res.json({ content: result });
  } catch (error) {
    console.error('Generate content error:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

const summarize = async (req, res) => {
  try {
    const { content, article_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const summary = await aiService.summarizeContent(content);

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id, article_id) VALUES ($1, $2, $3, $4, $5, $6)',
      ['summarization', content.substring(0, 500), summary, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id, article_id]
    );

    res.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: 'Failed to summarize content' });
  }
};

const answerQuestion = async (req, res) => {
  try {
    const { question, context, article_id } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    let contextText = context;
    if (article_id && !context) {
      const article = await pool.query('SELECT content FROM articles WHERE id = $1', [article_id]);
      if (article.rows.length > 0) {
        contextText = article.rows[0].content;
      }
    }

    const answer = await aiService.answerQuestion(question, contextText || '');

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id, article_id) VALUES ($1, $2, $3, $4, $5, $6)',
      ['qa', question, answer, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id, article_id]
    );

    res.json({ answer });
  } catch (error) {
    console.error('Answer question error:', error);
    res.status(500).json({ error: 'Failed to answer question' });
  }
};

const translate = async (req, res) => {
  try {
    const { content, target_language, article_id } = req.body;

    if (!content || !target_language) {
      return res.status(400).json({ error: 'Content and target language are required' });
    }

    const translated = await aiService.translateContent(content, target_language);

    if (article_id) {
      await pool.query(
        'INSERT INTO translations (article_id, language, content, translated_by) VALUES ($1, $2, $3, $4)',
        [article_id, target_language, translated, 'ai']
      );
    }

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id, article_id) VALUES ($1, $2, $3, $4, $5, $6)',
      ['translation', `Translate to ${target_language}`, translated, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id, article_id]
    );

    res.json({ translated });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: 'Failed to translate content' });
  }
};

const getSuggestions = async (req, res) => {
  try {
    const { content, article_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const suggestionsText = await aiService.generateSuggestions(content);

    let suggestions = [];
    try {
      const jsonMatch = suggestionsText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = suggestionsText.split('\n').filter(s => s.trim()).map(s => ({
          type: 'general',
          suggestion: s.replace(/^\d+\.\s*/, '')
        }));
      }
    } catch (e) {
      suggestions = suggestionsText.split('\n').filter(s => s.trim()).map(s => ({
        type: 'general',
        suggestion: s.replace(/^\d+\.\s*/, '')
      }));
    }

    if (article_id) {
      for (const sug of suggestions) {
        await pool.query(
          'INSERT INTO smart_suggestions (article_id, suggestion_type, suggestion) VALUES ($1, $2, $3)',
          [article_id, sug.type, sug.suggestion]
        );
      }
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ error: 'Failed to get suggestions' });
  }
};

const improveWriting = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const improved = await aiService.improveWriting(content);

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['writing_improvement', content.substring(0, 500), improved, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id]
    );

    res.json({ improved });
  } catch (error) {
    console.error('Improve writing error:', error);
    res.status(500).json({ error: 'Failed to improve writing' });
  }
};

const generateTags = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const tagsText = await aiService.generateTags(content);
    const tags = tagsText.split(',').map(t => t.trim()).filter(t => t);

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['tag_generation', content.substring(0, 500), tagsText, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id]
    );

    res.json({ tags });
  } catch (error) {
    console.error('Generate tags error:', error);
    res.status(500).json({ error: 'Failed to generate tags' });
  }
};

const generateTitle = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const titlesText = await aiService.generateTitle(content);
    const titles = titlesText.split('\n').map(t => t.trim()).filter(t => t);

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['title_generation', content.substring(0, 500), titlesText, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id]
    );

    res.json({ titles });
  } catch (error) {
    console.error('Generate title error:', error);
    res.status(500).json({ error: 'Failed to generate title' });
  }
};

const chat = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const articles = await pool.query(
      "SELECT id, title, content FROM articles WHERE status = 'published' LIMIT 10"
    );

    const answer = await aiService.chatWithKnowledgeBase(query, articles.rows);

    await pool.query(
      'INSERT INTO search_history (query, user_id, results_count) VALUES ($1, $2, $3)',
      [query, req.user.id, articles.rows.length]
    );

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['chat', query, answer, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id]
    );

    res.json({ answer, sources: articles.rows.map(a => ({ id: a.id, title: a.title })) });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
};

const getHistory = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_generations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get AI history error:', error);
    res.status(500).json({ error: 'Failed to get AI history' });
  }
};

// ── POST /ai/generate/stream ──────────────────────────────────────────────────
// Server-Sent Events (SSE) streaming version of generateContent.
// The client connects and receives incremental token chunks as they arrive from
// the AI model, then a final [DONE] event when complete.
// The full generated content is also persisted to ai_generations.
const generateContentStream = async (req, res) => {
  const { topic, type = 'article' } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Topic is required' });
  }

  // Set SSE headers before starting the stream
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx proxy buffering
  res.flushHeaders();

  const prompts = {
    article: `Write a comprehensive knowledge base article about "${topic}". Include:
      - Clear introduction
      - Main content with subheadings
      - Key points and best practices
      - Conclusion
      Format in markdown.`,
    tutorial: `Create a step-by-step tutorial about "${topic}". Include:
      - Prerequisites
      - Numbered steps with clear instructions
      - Code examples if applicable
      - Tips and troubleshooting
      Format in markdown.`,
    faq: `Generate a FAQ section about "${topic}". Include:
      - 5-10 common questions
      - Detailed answers for each
      - Related resources
      Format in markdown.`,
    documentation: `Write technical documentation about "${topic}". Include:
      - Overview
      - Features/Components
      - Usage examples
      - API reference if applicable
      Format in markdown.`
  };

  const messages = [
    { role: 'system', content: 'You are a professional technical writer creating knowledge base content.' },
    { role: 'user', content: prompts[type] || prompts.article }
  ];

  try {
    const fullContent = await aiService.makeStreamingRequest(messages, res);

    // Persist after stream completes
    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['content_generation_stream', topic, fullContent, process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', req.user.id]
    );

    // Signal completion with metadata
    res.write(`data: ${JSON.stringify({ done: true, topic, type })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Generate content stream error:', error);
    // Attempt to send error over the still-open SSE connection
    try {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } catch {
      res.end();
    }
  }
};

// POST /api/ai/duplicate-check
// Semantic duplicate detector: compares new article against existing articles in same category
const duplicateCheck = async (req, res) => {
  try {
    const { title, summary, categoryId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    // Fetch existing articles in the same category (limit 50)
    let existingArticles;
    if (categoryId) {
      existingArticles = await pool.query(
        'SELECT id, title, summary FROM articles WHERE category_id = $1 ORDER BY updated_at DESC LIMIT 50',
        [categoryId]
      );
    } else {
      existingArticles = await pool.query(
        'SELECT id, title, summary FROM articles ORDER BY updated_at DESC LIMIT 50'
      );
    }

    const articleList = existingArticles.rows
      .map(a => `- ID: ${a.id} | Title: ${a.title}${a.summary ? ' | Summary: ' + a.summary.substring(0, 100) : ''}`)
      .join('\n');

    const messages = [
      {
        role: 'system',
        content: 'You are a semantic duplicate detection AI. Compare article titles and summaries for semantic similarity. Always return valid JSON with no markdown.'
      },
      {
        role: 'user',
        content: `Check if this new article is a semantic duplicate of any existing articles.

New article:
Title: ${title}
Summary: ${summary || 'N/A'}

Existing articles:
${articleList || 'No existing articles'}

Return JSON: { "is_duplicate": boolean, "similarity_score": number (0-100), "similar_articles": [{"id": "...", "title": "...", "similarity_reason": "..."}], "recommendation": "string" }`
      }
    ];

    const result = await aiService.makeRequest(messages);

    let parsed;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : result);
    } catch {
      parsed = { is_duplicate: false, similarity_score: 0, similar_articles: [], recommendation: result };
    }

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['duplicate_check', title, JSON.stringify(parsed), process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user.id]
    );

    res.json(parsed);
  } catch (error) {
    console.error('Duplicate check error:', error);
    res.status(500).json({ error: 'Failed to check for duplicates' });
  }
};

// GET /api/ai/freshness-report
// Runs detectOutdatedContent on articles not updated in 90+ days, aggregates by category
const freshnessReport = async (req, res) => {
  try {
    const staleArticles = await pool.query(`
      SELECT a.id, a.title, a.summary, a.status, a.views, a.updated_at,
             c.name as category_name
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.updated_at < NOW() - INTERVAL '90 days'
        AND a.status != 'archived'
      ORDER BY a.updated_at ASC
      LIMIT 100
    `);

    if (staleArticles.rows.length === 0) {
      return res.json({
        stale_count: 0,
        categories: [],
        report: 'All articles are up to date (updated within the last 90 days).',
        generated_at: new Date().toISOString()
      });
    }

    // Aggregate by category
    const byCategory = {};
    staleArticles.rows.forEach(a => {
      const cat = a.category_name || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({ id: a.id, title: a.title, last_updated: a.updated_at, views: a.views });
    });

    const messages = [
      {
        role: 'system',
        content: 'You are a knowledge base editorial AI. Analyze article freshness data and produce an editorial health report with actionable recommendations for content teams.'
      },
      {
        role: 'user',
        content: `Generate a content freshness editorial health report for these ${staleArticles.rows.length} articles not updated in 90+ days, grouped by category:

${JSON.stringify(byCategory, null, 2)}

Return a structured report with: overall health score (0-100), category-level findings, top 5 articles needing immediate update, and recommended editorial actions.`
      }
    ];

    const result = await aiService.makeRequest(messages);

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['freshness_report', `Freshness report: ${staleArticles.rows.length} stale articles`, result, process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user.id]
    );

    res.json({
      stale_count: staleArticles.rows.length,
      categories: Object.entries(byCategory).map(([cat, articles]) => ({ category: cat, stale_articles: articles.length, articles })),
      report: result,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Freshness report error:', error);
    res.status(500).json({ error: 'Failed to generate freshness report' });
  }
};

// POST /api/ai/knowledge-gap
// Analyze team bookmarks + search history to find topics frequently searched but rarely found
const knowledgeGapAnalysis = async (req, res) => {
  try {
    // Get search history
    const searchHistory = await pool.query(
      `SELECT query, COUNT(*) as search_count
       FROM search_history
       WHERE user_id = $1
       GROUP BY query
       ORDER BY search_count DESC
       LIMIT 50`,
      [req.user.id]
    );

    // Get bookmarks
    const bookmarks = await pool.query(
      `SELECT a.title, a.category_id, c.name as category_name
       FROM bookmarks b
       JOIN articles a ON b.article_id = a.id
       LEFT JOIN categories c ON a.category_id = c.id
       WHERE b.user_id = $1
       LIMIT 50`,
      [req.user.id]
    );

    // Get total article count per topic area (category)
    const categoryArticleCounts = await pool.query(
      `SELECT c.name as category, COUNT(a.id) as article_count
       FROM categories c
       LEFT JOIN articles a ON a.category_id = c.id
       GROUP BY c.name
       ORDER BY article_count ASC`
    );

    const messages = [
      {
        role: 'system',
        content: 'You are a knowledge management AI. Identify gaps in a knowledge base by analyzing search patterns, bookmarks, and article coverage. Generate specific article topic suggestions to fill those gaps.'
      },
      {
        role: 'user',
        content: `Analyze this team member's knowledge base usage patterns to identify knowledge gaps:

Search History (frequent searches):
${JSON.stringify(searchHistory.rows, null, 2)}

Bookmarked Articles:
${JSON.stringify(bookmarks.rows, null, 2)}

Category Article Counts (lower = less coverage):
${JSON.stringify(categoryArticleCounts.rows, null, 2)}

Identify: 1) Topics searched frequently but likely lacking articles, 2) Categories with thin coverage, 3) Generate 5 specific article title suggestions to fill the most critical gaps. Return as structured JSON with: gaps (array), suggested_articles (array with title, category, rationale), priority_score (0-100).`
      }
    ];

    const result = await aiService.makeRequest(messages);

    let parsed;
    try {
      const m = result.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(m ? m[0] : result);
    } catch {
      parsed = { analysis: result };
    }

    await pool.query(
      'INSERT INTO ai_generations (type, prompt, result, model, user_id) VALUES ($1, $2, $3, $4, $5)',
      ['knowledge_gap', 'Team knowledge gap analysis', JSON.stringify(parsed), process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022', req.user.id]
    );

    res.json({ ...parsed, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error('Knowledge gap analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze knowledge gaps' });
  }
};

module.exports = {
  generateContent,
  generateContentStream,
  summarize,
  answerQuestion,
  translate,
  getSuggestions,
  improveWriting,
  generateTags,
  generateTitle,
  chat,
  getHistory,
  duplicateCheck,
  freshnessReport,
  knowledgeGapAnalysis
};
