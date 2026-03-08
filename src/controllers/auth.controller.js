const rateLimit = require('express-rate-limit');
const config = require('../config');
const authService = require('../services/auth.service');

function parseJwtMaxAge(expiresIn) {
  if (typeof expiresIn === 'number') return expiresIn * 1000;
  if (typeof expiresIn !== 'string' || !expiresIn.trim()) return 24 * 60 * 60 * 1000;

  const value = expiresIn.trim().toLowerCase();
  const match = value.match(/^(\d+)([smhd])?$/);
  if (!match) return 24 * 60 * 60 * 1000;

  const amount = Number(match[1]);
  const unit = match[2] || 's';
  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
  },
});

function showLogin(req, res) {
  res.render('login', {
    brand: config.brand,
    error: null,
    pageTitle: 'Đăng nhập - LUMÉ LASHES',
  });
}

async function login(req, res) {
  try {
    const { username, password } = req.body;

    const user = await authService.authenticateUser(username, password);
    if (!user) {
      if (req.accepts('html')) {
        return res.status(401).render('login', {
          brand: config.brand,
          error: 'Sai tài khoản hoặc mật khẩu',
          pageTitle: 'Đăng nhập - LUMÉ LASHES',
        });
      }
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = authService.signAccessToken(user);
    res.cookie(config.auth.jwtCookieName, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.nodeEnv === 'production',
      maxAge: parseJwtMaxAge(config.auth.jwtExpiresIn),
    });

    if (req.accepts('html')) {
      return res.redirect('/');
    }

    return res.json({
      success: true,
      token,
      user: {
        id: String(user._id),
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

function logout(req, res) {
  res.clearCookie(config.auth.jwtCookieName);

  if (req.accepts('html')) {
    return res.redirect('/login');
  }

  return res.json({ success: true });
}

module.exports = {
  loginLimiter,
  showLogin,
  login,
  logout,
  parseJwtMaxAge,
};
