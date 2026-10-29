const crypto = require('crypto');
const { promisify } = require('util');
const { User } = require('./models/User');

const SECRET = process.env.AUTH_SECRET || 'helpdesk-dev-secret';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = await scrypt(String(password), salt, 64);
  return `${salt}:${hash.toString('hex')}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || '').split(':');
  if (!salt || !hash) return false;
  const candidate = await scrypt(String(password), salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return expected.length === candidate.length && crypto.timingSafeEqual(candidate, expected);
}

function signToken(user) {
  const body = Buffer.from(
    JSON.stringify({
      sub: String(user._id),
      v: user.tokenVersion || 0,
      exp: Date.now() + TTL_MS,
    })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const payload = verifyToken(token);
    if (!payload) return res.status(401).json({ error: 'Please sign in.' });
    const user = await User.findById(payload.sub).select(
      'name email role active tokenVersion'
    );
    if (!user || user.active === false) {
      return res.status(401).json({ error: 'Please sign in.' });
    }
    if ((payload.v || 0) !== (user.tokenVersion || 0)) {
      return res.status(401).json({ error: 'Please sign in.' });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administration only.' });
  next();
}

function staffOnly(req, res, next) {
  if (!['admin', 'support'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'IT support only.' });
  }
  next();
}

module.exports = {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  auth,
  adminOnly,
  staffOnly,
};
