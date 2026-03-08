const config = require('../config');
const authService = require('../services/auth.service');

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  if (req.cookies && req.cookies[config.auth.jwtCookieName]) {
    return req.cookies[config.auth.jwtCookieName];
  }

  return null;
}

function wantsJson(req) {
  const accept = (req.headers.accept || '').toLowerCase();
  const contentType = (req.headers['content-type'] || '').toLowerCase();

  return req.originalUrl.startsWith('/api/')
    || accept.includes('application/json')
    || contentType.includes('application/json')
    || req.xhr;
}

function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);

  if (!token) {
    if (!wantsJson(req)) {
      return res.redirect('/login');
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      username: payload.username,
      role: payload.role,
    };
    return next();
  } catch (error) {
    if (!wantsJson(req)) {
      return res.redirect('/login');
    }
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

function optionalAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return next();

  try {
    const payload = authService.verifyAccessToken(token);
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
  } catch (error) {
    // ignore invalid optional token
  }
  return next();
}

module.exports = {
  requireAuth,
  optionalAuth,
  getTokenFromRequest,
};
