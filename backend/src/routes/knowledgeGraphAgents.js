const router = require('express').Router();
const https = require('https');
const { authenticateToken } = require('../middleware/auth');

const makeAiRequest = (systemPrompt, userPrompt) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 8000,
      temperature: 0.3
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
              resolve({ analysis: content });
            }
          } else if (response.error) {
            reject(new Error(response.error.message || 'AI request failed'));
          } else {
            reject(new Error('Unexpected AI response format'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

router.post('/extract-entities', authenticateToken, async (req, res) => {
  try {
    const { text, doc_type } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const systemPrompt = 'You are a knowledge graph entity extractor. Extract named entities and their relationships from text. Always return valid JSON with no markdown.';
    const userPrompt = `Extract entities and relationships from this ${doc_type || 'text'}. Text: "${text}". Return JSON with: entities (array with name, type [Person/Organization/Technology/Concept/Location/Event/Product], description), relationships (array with source, target, type, confidence_score), summary, key_topics.`;

    const result = await makeAiRequest(systemPrompt, userPrompt);
    res.json(result);
  } catch (e) {
    console.error('Extract entities error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/query-graph', authenticateToken, async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ error: 'question is required' });

    const systemPrompt = 'You are a knowledge base Q&A assistant. Answer questions using the provided knowledge graph context. Return JSON with answer and sources.';
    const userPrompt = `Answer this knowledge graph question: "${question}". Context: ${context || 'General knowledge graph'}. Return JSON with: answer, sources (array of source references), reasoning_path (array of steps), entities_involved (array), confidence, related_questions (array of 3 follow-up questions).`;

    const result = await makeAiRequest(systemPrompt, userPrompt);
    res.json(result);
  } catch (e) {
    console.error('Query graph error:', e);
    res.status(500).json({ error: e.message });
  }
});

router.post('/find-connections', authenticateToken, async (req, res) => {
  try {
    const { entity1, entity2 } = req.body;
    if (!entity1 || !entity2) return res.status(400).json({ error: 'entity1 and entity2 are required' });

    const systemPrompt = 'You are a knowledge graph connection finder. Identify relationships and paths between entities. Return JSON with connections array.';
    const userPrompt = `Find connections between "${entity1}" and "${entity2}". Return JSON with: connections (array of connection objects with type, description, strength), direct_connections (array), indirect_paths (array with path description and length), strength_score, common_topics, surprising_connections.`;

    const result = await makeAiRequest(systemPrompt, userPrompt);
    res.json(result);
  } catch (e) {
    console.error('Find connections error:', e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
