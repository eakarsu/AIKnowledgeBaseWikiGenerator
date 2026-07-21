const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
require('dotenv').config({ path: '../.env' });

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  if (!JWT_SECRET || JWT_SECRET.length < 32) return res.status(503).json({ error: 'Authentication is not configured' });
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const blacklisted = await pool.query(
      'SELECT id FROM token_blacklist WHERE token = $1',
      [token]
    );
    if (blacklisted.rows.length > 0) {
      return res.status(403).json({ error: 'Token has been revoked' });
    }
  } catch (err) {
    return res.status(503).json({ error: 'Token revocation state is unavailable' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    req.token = token;
    next();
  });
};

const optionalAuth = (req, res, next) => {
  if (!JWT_SECRET || JWT_SECRET.length < 32) return next();
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

const generateToken = (user) => {
  if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('Authentication is not configured');
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, tenantId: process.env.GOVERNANCE_TENANT_ID },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { authenticateToken, optionalAuth, generateToken };
