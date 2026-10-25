const express = require('express');
const { User } = require('../models/User');
const { verifyPassword, signToken } = require('../auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user || !verifyPassword(password, user.passwordHash)) {
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

module.exports = router;
