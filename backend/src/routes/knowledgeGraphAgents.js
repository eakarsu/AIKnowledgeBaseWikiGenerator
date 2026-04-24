const router = require('express').Router();
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const ai = async (prompt) => {
  const r = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
    messages: [{ role: 'user', content: prompt }]
  }, { headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' } });
  const c = r.data.choices[0].message.content;
  try { return JSON.parse(c); } catch { return { analysis: c }; }
};

router.post('/extract-entities', authenticateToken, async (req, res) => {
  try {
    const { text, doc_type } = req.body;
    const result = await ai(`Extract entities and relationships from this ${doc_type || 'text'}. Text: "${text}". Return JSON with: entities (array with name, type [Person/Organization/Technology/Concept/Location/Event/Product], description), relationships (array with source, target, type, confidence_score), summary, key_topics.`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/query-graph', authenticateToken, async (req, res) => {
  try {
    const { question, context } = req.body;
    const result = await ai(`Answer this knowledge graph question: "${question}". Context: ${context || 'General knowledge graph'}. Return JSON with: answer, reasoning_path (array of steps), entities_involved (array), confidence, related_questions (array of 3 follow-up questions).`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/find-connections', authenticateToken, async (req, res) => {
  try {
    const { entity1, entity2 } = req.body;
    const result = await ai(`Find connections between "${entity1}" and "${entity2}". Return JSON with: direct_connections (array), indirect_paths (array with path description and length), strength_score, common_topics, surprising_connections.`);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
