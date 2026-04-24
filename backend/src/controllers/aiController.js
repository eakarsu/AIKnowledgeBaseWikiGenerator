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

module.exports = {
  generateContent,
  summarize,
  answerQuestion,
  translate,
  getSuggestions,
  improveWriting,
  generateTags,
  generateTitle,
  chat,
  getHistory
};
