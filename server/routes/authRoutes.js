const express = require('express');
const { User } = require('../models/User');
const { auth, verifyPassword, hashPassword, signToken } = require('../auth');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  key: (req) => `${req.ip}:${String(req.body?.email || '').toLowerCase()}`,
  message: 'Too many sign-in attempts. Try again in a few minutes.',
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res, next) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/password — signed-in users change their own password.
router.put('/password', auth, async (req, res, next) => {
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }
  if (newPassword.length < 8 || newPassword.length > 128) {
    return res.status(400).json({ error: 'New password must be 8 to 128 characters.' });
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user || !(await verifyPassword(currentPassword, user.passwordHash))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    res.json({ message: 'Password updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
