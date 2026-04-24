const { pool } = require('../config/database');
const aiService = require('../services/aiService');

// Robust JSON extraction — handles markdown fences, extra text, truncated responses
const extractJSON = (str) => {
  if (!str) return null;
  if (typeof str === 'object') return str;
  // Try direct parse
  try { return JSON.parse(str); } catch {}
  // Strip markdown code fences
  const fenceMatch = str.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }
  // Find first { and last }
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(str.substring(firstBrace, lastBrace + 1)); } catch {}
  }
  // Handle truncated JSON — try to repair by closing open brackets/braces
  if (firstBrace !== -1) {
    let jsonStr = str.substring(firstBrace);
    // If we're inside an unclosed string, close it and trim the incomplete part
    let inStr = false, esc = false;
    for (let i = 0; i < jsonStr.length; i++) {
      if (esc) { esc = false; continue; }
      if (jsonStr[i] === '\\') { esc = true; continue; }
      if (jsonStr[i] === '"') inStr = !inStr;
    }
    if (inStr) {
      // Find the last properly closed string and truncate after it
      let lastGoodPos = 0;
      inStr = false; esc = false;
      for (let i = 0; i < jsonStr.length; i++) {
        if (esc) { esc = false; continue; }
        if (jsonStr[i] === '\\') { esc = true; continue; }
        if (jsonStr[i] === '"') {
          inStr = !inStr;
          if (!inStr) lastGoodPos = i + 1; // end of a closed string
        }
      }
      jsonStr = jsonStr.substring(0, lastGoodPos);
    }
    // Remove trailing commas or incomplete key-value pairs
    jsonStr = jsonStr.replace(/,\s*$/, '');
    // Count and close open braces/brackets
    let opens = 0, openBrackets = 0;
    inStr = false; esc = false;
    for (const ch of jsonStr) {
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') opens++;
      if (ch === '}') opens--;
      if (ch === '[') openBrackets++;
      if (ch === ']') openBrackets--;
    }
    jsonStr += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, opens));
    try { return JSON.parse(jsonStr); } catch {}
  }
  console.error('extractJSON: Could not parse AI response. First 200 chars:', str.substring(0, 200));
  return null;
};

// ==================== ARTICLE SUGGESTIONS ====================

const getArticleSuggestions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM article_suggestions ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get article suggestions error:', error);
    res.status(500).json({ error: 'Failed to get article suggestions' });
  }
};

const getArticleSuggestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM article_suggestions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article suggestion not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get article suggestion error:', error);
    res.status(500).json({ error: 'Failed to get article suggestion' });
  }
};

const createArticleSuggestion = async (req, res) => {
  try {
    const { topic, target_audience, difficulty, generate_ai } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    let aiResponse = null;
    let title = null;
    let summary = null;
    let outline = null;
    let keywords = null;
    let estimatedLength = null;

    if (generate_ai !== false) {
      const aiResult = await aiService.suggestArticle(topic, { targetAudience: target_audience, difficulty });
      aiResponse = aiResult;

      const parsed = extractJSON(aiResult);
      if (parsed) {
        title = parsed.title;
        summary = parsed.summary;
        outline = parsed.outline ? JSON.stringify(parsed.outline) : null;
        keywords = Array.isArray(parsed.keywords) ? parsed.keywords.join(', ') : parsed.keywords;
        estimatedLength = parsed.estimatedLength;
      }
    }

    const result = await pool.query(
      `INSERT INTO article_suggestions
       (topic, title, summary, outline, keywords, target_audience, difficulty, estimated_length, ai_response, user_id, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [topic, title, summary, outline, keywords, target_audience, difficulty || 'Intermediate', estimatedLength, JSON.stringify(aiResponse), req.user.id, 'generated']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create article suggestion error:', error);
    res.status(500).json({ error: 'Failed to create article suggestion' });
  }
};

const updateArticleSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, title, summary, outline, keywords, target_audience, difficulty, status } = req.body;

    const result = await pool.query(
      `UPDATE article_suggestions
       SET topic = COALESCE($1, topic), title = COALESCE($2, title), summary = COALESCE($3, summary),
           outline = COALESCE($4, outline), keywords = COALESCE($5, keywords), target_audience = COALESCE($6, target_audience),
           difficulty = COALESCE($7, difficulty), status = COALESCE($8, status), updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 RETURNING *`,
      [topic, title, summary, outline, keywords, target_audience, difficulty, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article suggestion not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update article suggestion error:', error);
    res.status(500).json({ error: 'Failed to update article suggestion' });
  }
};

const deleteArticleSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM article_suggestions WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article suggestion not found' });
    }
    res.json({ message: 'Article suggestion deleted successfully' });
  } catch (error) {
    console.error('Delete article suggestion error:', error);
    res.status(500).json({ error: 'Failed to delete article suggestion' });
  }
};

// ==================== API DOCUMENTATION ====================

const getApiDocumentations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM api_documentations ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get API documentations error:', error);
    res.status(500).json({ error: 'Failed to get API documentations' });
  }
};

const getApiDocumentationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM api_documentations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API documentation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get API documentation error:', error);
    res.status(500).json({ error: 'Failed to get API documentation' });
  }
};

const createApiDocumentation = async (req, res) => {
  try {
    const { name, endpoint, method, description, category, version, generate_ai } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'API name is required' });
    }

    let aiResponse = null;
    let requestBody = null;
    let responseBody = null;
    let parameters = null;
    let headers = null;
    let examples = null;
    let authentication = null;

    if (generate_ai !== false) {
      const aiResult = await aiService.generateApiDocumentation({ name, endpoint, method, description });
      aiResponse = aiResult;

      const parsed = extractJSON(aiResult);
      if (parsed) {
        requestBody = parsed.requestBody ? JSON.stringify(parsed.requestBody) : null;
        responseBody = parsed.responseBody ? JSON.stringify(parsed.responseBody) : null;
        parameters = parsed.parameters ? JSON.stringify(parsed.parameters) : null;
        headers = parsed.headers ? JSON.stringify(parsed.headers) : null;
        examples = parsed.examples ? JSON.stringify(parsed.examples) : null;
        authentication = parsed.authentication;
      }
    }

    const result = await pool.query(
      `INSERT INTO api_documentations
       (name, endpoint, method, description, request_body, response_body, parameters, headers, examples, authentication, category, version, ai_response, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, endpoint || '/api/' + name.toLowerCase().replace(/\s+/g, '-'), method || 'GET', description, requestBody, responseBody, parameters, headers, examples, authentication, category || 'General', version || 'v1', JSON.stringify(aiResponse), req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create API documentation error:', error);
    res.status(500).json({ error: 'Failed to create API documentation' });
  }
};

const updateApiDocumentation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, endpoint, method, description, request_body, response_body, parameters, headers, examples, authentication, category, version, status } = req.body;

    const result = await pool.query(
      `UPDATE api_documentations
       SET name = COALESCE($1, name), endpoint = COALESCE($2, endpoint), method = COALESCE($3, method),
           description = COALESCE($4, description), request_body = COALESCE($5, request_body),
           response_body = COALESCE($6, response_body), parameters = COALESCE($7, parameters),
           headers = COALESCE($8, headers), examples = COALESCE($9, examples),
           authentication = COALESCE($10, authentication), category = COALESCE($11, category),
           version = COALESCE($12, version), status = COALESCE($13, status), updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 RETURNING *`,
      [name, endpoint, method, description, request_body, response_body, parameters, headers, examples, authentication, category, version, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API documentation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update API documentation error:', error);
    res.status(500).json({ error: 'Failed to update API documentation' });
  }
};

const deleteApiDocumentation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM api_documentations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API documentation not found' });
    }
    res.json({ message: 'API documentation deleted successfully' });
  } catch (error) {
    console.error('Delete API documentation error:', error);
    res.status(500).json({ error: 'Failed to delete API documentation' });
  }
};

// ==================== SEARCH OPTIMIZATIONS ====================

const getSearchOptimizations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM search_optimizations ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get search optimizations error:', error);
    res.status(500).json({ error: 'Failed to get search optimizations' });
  }
};

const getSearchOptimizationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM search_optimizations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Search optimization not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get search optimization error:', error);
    res.status(500).json({ error: 'Failed to get search optimization' });
  }
};

const createSearchOptimization = async (req, res) => {
  try {
    const { original_query } = req.body;

    if (!original_query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const aiResult = await aiService.optimizeSearch(original_query);
    let optimizedQuery = null;
    let suggestions = null;
    let synonyms = null;
    let relatedTerms = null;
    let searchTips = null;

    const parsed = extractJSON(aiResult);
    if (parsed) {
      optimizedQuery = parsed.optimizedQuery;
      suggestions = parsed.suggestions ? JSON.stringify(parsed.suggestions) : null;
      synonyms = parsed.synonyms ? JSON.stringify(parsed.synonyms) : null;
      relatedTerms = parsed.relatedTerms ? JSON.stringify(parsed.relatedTerms) : null;
      searchTips = parsed.searchTips ? JSON.stringify(parsed.searchTips) : null;
    }

    const result = await pool.query(
      `INSERT INTO search_optimizations
       (original_query, optimized_query, suggestions, synonyms, related_terms, search_tips, ai_response, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [original_query, optimizedQuery, suggestions, synonyms, relatedTerms, searchTips, JSON.stringify(aiResult), req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create search optimization error:', error);
    res.status(500).json({ error: 'Failed to create search optimization' });
  }
};

const deleteSearchOptimization = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM search_optimizations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Search optimization not found' });
    }
    res.json({ message: 'Search optimization deleted successfully' });
  } catch (error) {
    console.error('Delete search optimization error:', error);
    res.status(500).json({ error: 'Failed to delete search optimization' });
  }
};

// ==================== OUTDATED CONTENT ====================

const getOutdatedContent = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM outdated_content ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get outdated content error:', error);
    res.status(500).json({ error: 'Failed to get outdated content' });
  }
};

const getOutdatedContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM outdated_content WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outdated content record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get outdated content error:', error);
    res.status(500).json({ error: 'Failed to get outdated content' });
  }
};

const createOutdatedContentCheck = async (req, res) => {
  try {
    const { article_id, content, title, last_updated } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const aiResult = await aiService.detectOutdatedContent(content, { title, lastUpdated: last_updated });
    let reason = null;
    let severity = 'low';
    let recommendations = null;
    let detectedIssues = null;

    const parsed = extractJSON(aiResult);
    if (parsed) {
      reason = parsed.suggestedUpdates;
      severity = parsed.severity || 'low';
      recommendations = parsed.recommendations ? JSON.stringify(parsed.recommendations) : null;
      detectedIssues = parsed.detectedIssues ? JSON.stringify(parsed.detectedIssues) : null;
    }

    const result = await pool.query(
      `INSERT INTO outdated_content
       (article_id, article_title, content_snippet, reason, severity, recommendations, last_updated, detected_issues, ai_response, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [article_id || null, title, content.substring(0, 500), reason, severity, recommendations, last_updated || null, detectedIssues, JSON.stringify(aiResult), req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create outdated content check error:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
};

const updateOutdatedContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolved_at } = req.body;

    const result = await pool.query(
      `UPDATE outdated_content
       SET status = COALESCE($1, status), resolved_at = COALESCE($2, resolved_at)
       WHERE id = $3 RETURNING *`,
      [status, resolved_at, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outdated content record not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update outdated content error:', error);
    res.status(500).json({ error: 'Failed to update outdated content' });
  }
};

const deleteOutdatedContent = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM outdated_content WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Outdated content record not found' });
    }
    res.json({ message: 'Outdated content record deleted successfully' });
  } catch (error) {
    console.error('Delete outdated content error:', error);
    res.status(500).json({ error: 'Failed to delete outdated content' });
  }
};

// ==================== FAQ ENTRIES ====================

const getFaqEntries = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM faq_entries ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get FAQ entries error:', error);
    res.status(500).json({ error: 'Failed to get FAQ entries' });
  }
};

const getFaqEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM faq_entries WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get FAQ entry error:', error);
    res.status(500).json({ error: 'Failed to get FAQ entry' });
  }
};

const createFaqEntry = async (req, res) => {
  try {
    const { question, answer, topic, category, generate_ai } = req.body;

    if (!question && !topic) {
      return res.status(400).json({ error: 'Question or topic is required' });
    }

    let finalQuestion = question;
    let finalAnswer = answer;
    let relatedQuestions = null;
    let aiResponse = null;

    if (generate_ai !== false && topic) {
      const aiResult = await aiService.generateFAQ(topic);
      aiResponse = aiResult;

      const parsed = extractJSON(aiResult);
      if (parsed && parsed.faqs && parsed.faqs.length > 0) {
        const firstFaq = parsed.faqs[0];
        finalQuestion = finalQuestion || firstFaq.question;
        finalAnswer = finalAnswer || firstFaq.answer;
        relatedQuestions = JSON.stringify(firstFaq.relatedQuestions || []);
      }
    }

    const result = await pool.query(
      `INSERT INTO faq_entries
       (question, answer, category, topic, related_questions, ai_response, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [finalQuestion, finalAnswer, category || 'General', topic, relatedQuestions, JSON.stringify(aiResponse), req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create FAQ entry error:', error);
    res.status(500).json({ error: 'Failed to create FAQ entry' });
  }
};

const generateBulkFaqs = async (req, res) => {
  try {
    const { topic, context } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const aiResult = await aiService.generateFAQ(topic, context);
    let faqs = [];

    const parsed = extractJSON(aiResult);
    if (parsed && parsed.faqs) {
      for (const faq of parsed.faqs) {
        const result = await pool.query(
          `INSERT INTO faq_entries
           (question, answer, category, topic, related_questions, ai_response, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [faq.question, faq.answer, faq.category || 'General', topic, JSON.stringify(faq.relatedQuestions || []), JSON.stringify(aiResult), req.user.id]
        );
        faqs.push(result.rows[0]);
      }
    } else {
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    res.status(201).json({ faqs, count: faqs.length });
  } catch (error) {
    console.error('Generate bulk FAQs error:', error);
    res.status(500).json({ error: 'Failed to generate FAQs' });
  }
};

const updateFaqEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, topic, status } = req.body;

    const result = await pool.query(
      `UPDATE faq_entries
       SET question = COALESCE($1, question), answer = COALESCE($2, answer),
           category = COALESCE($3, category), topic = COALESCE($4, topic),
           status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [question, answer, category, topic, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ entry not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update FAQ entry error:', error);
    res.status(500).json({ error: 'Failed to update FAQ entry' });
  }
};

const deleteFaqEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM faq_entries WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'FAQ entry not found' });
    }
    res.json({ message: 'FAQ entry deleted successfully' });
  } catch (error) {
    console.error('Delete FAQ entry error:', error);
    res.status(500).json({ error: 'Failed to delete FAQ entry' });
  }
};

// ==================== AI TRANSLATIONS ====================

const getAiTranslations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM ai_translations ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get AI translations error:', error);
    res.status(500).json({ error: 'Failed to get AI translations' });
  }
};

const getAiTranslationById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM ai_translations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI translation not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get AI translation error:', error);
    res.status(500).json({ error: 'Failed to get AI translation' });
  }
};

const createAiTranslation = async (req, res) => {
  try {
    const { source_text, target_language, context, tone, glossary_terms } = req.body;

    if (!source_text || !target_language) {
      return res.status(400).json({ error: 'Source text and target language are required' });
    }

    const aiResult = await aiService.translateAdvanced(source_text, target_language, { context, tone, glossary: glossary_terms });
    let translatedText = null;
    let sourceLanguage = null;
    let qualityScore = null;

    const parsed = extractJSON(aiResult);
    if (parsed) {
      translatedText = parsed.translatedText;
      sourceLanguage = parsed.sourceLanguage;
      qualityScore = parsed.qualityScore;
    } else {
      translatedText = aiResult;
    }

    const result = await pool.query(
      `INSERT INTO ai_translations
       (source_text, source_language, target_language, translated_text, context, tone, glossary_terms, quality_score, ai_response, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [source_text, sourceLanguage, target_language, translatedText, context, tone, glossary_terms, qualityScore, JSON.stringify(aiResult), req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create AI translation error:', error);
    res.status(500).json({ error: 'Failed to create AI translation' });
  }
};

const deleteAiTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM ai_translations WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'AI translation not found' });
    }
    res.json({ message: 'AI translation deleted successfully' });
  } catch (error) {
    console.error('Delete AI translation error:', error);
    res.status(500).json({ error: 'Failed to delete AI translation' });
  }
};

module.exports = {
  // Article Suggestions
  getArticleSuggestions,
  getArticleSuggestionById,
  createArticleSuggestion,
  updateArticleSuggestion,
  deleteArticleSuggestion,
  // API Documentation
  getApiDocumentations,
  getApiDocumentationById,
  createApiDocumentation,
  updateApiDocumentation,
  deleteApiDocumentation,
  // Search Optimization
  getSearchOptimizations,
  getSearchOptimizationById,
  createSearchOptimization,
  deleteSearchOptimization,
  // Outdated Content
  getOutdatedContent,
  getOutdatedContentById,
  createOutdatedContentCheck,
  updateOutdatedContent,
  deleteOutdatedContent,
  // FAQ Entries
  getFaqEntries,
  getFaqEntryById,
  createFaqEntry,
  generateBulkFaqs,
  updateFaqEntry,
  deleteFaqEntry,
  // AI Translations
  getAiTranslations,
  getAiTranslationById,
  createAiTranslation,
  deleteAiTranslation
};
