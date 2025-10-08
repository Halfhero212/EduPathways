const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.SESSION_SECRET || 'your-secret-key-change-in-production';

const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
    res.clearCookie('token');
    return res.redirect('/login');
  }
};

const optionalAuth = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ success: false, error: 'Access denied' });
      }
      return res.status(403).send('Access denied');
    }
    next();
  };
};

module.exports = { authenticateToken, optionalAuth, requireRole, JWT_SECRET };
