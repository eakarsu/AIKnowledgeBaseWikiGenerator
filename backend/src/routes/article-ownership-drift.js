const express = require('express');
const router = express.Router();
function assess(input = {}) {
  const articles = input.articles || [
    { title: 'API auth setup', owner_active: false, days_since_update: 190, views_30d: 840 },
    { title: 'Billing FAQ', owner_active: true, days_since_update: 22, views_30d: 310 },
  ];
  return { articles: articles.map(a => {
    const score = (a.owner_active ? 0 : 45) + Math.min(40, Number(a.days_since_update) / 6) + Math.min(20, Number(a.views_30d) / 80);
    return { ...a, drift_score: Math.round(score), action: score >= 70 ? 'reassign_owner_now' : score >= 40 ? 'schedule_review' : 'current' };
  }) };
}
router.get('/', (req, res) => res.json(assess()));
router.post('/assess', (req, res) => res.json(assess(req.body || {})));
module.exports = router;
