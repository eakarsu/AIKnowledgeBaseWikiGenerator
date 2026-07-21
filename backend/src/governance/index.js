'use strict';
const { createRouter } = require('./router');
const { postgres } = require('./store');
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { evaluate } = require('./domain');
module.exports = createRouter({ db: postgres(pool), auth: authenticateToken, evaluate,
  workflow: 'knowledge-publishing',
  providers: ['document-connector','saas-connector','cms','search','vector-store','identity','model-gateway','notifications'],
  approverRoles: ['editor','publisher','knowledge_owner','admin'] });

