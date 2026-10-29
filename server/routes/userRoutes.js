const crypto = require('crypto');
const express = require('express');
const { isValidObjectId } = require('mongoose');
const { User } = require('../models/User');
const { Ticket } = require('../models/Ticket');
const { AuditEvent, recordAudit } = require('../models/AuditEvent');
const { hashPassword, adminOnly, temporaryPasswordExpiry } = require('../auth');
const { parseAccount, normalizeEmail, EMAIL_RE, COMPANY_DOMAIN } = require('../accountRules');

const router = express.Router();
const ACCOUNT_ROLES = ['employee', 'support'];

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active !== false,
    createdAt: user.createdAt,
  };
}

// GET /api/users?role=employee|support — administration lists accounts.
router.get('/', adminOnly, async (req, res, next) => {
  const role = req.query.role === undefined ? 'support' : req.query.role;
  if (!ACCOUNT_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be employee or support.' });
  }

  try {
    if (role === 'support') {
      const users = await User.find({ role, deletedAt: null })
        .select('name email role active createdAt')
        .sort({ createdAt: 1 });
      return res.json(users.map(publicUser));
    }

    const users = await User.aggregate([
      { $match: { role: 'employee', deletedAt: null } },
      { $sort: { createdAt: 1 } },
      {
        $lookup: {
          from: 'tickets',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'employeeTickets',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          role: 1,
          active: 1,
          createdAt: 1,
          ticketCount: { $size: '$employeeTickets' },
        },
      },
    ]);
    res.json(users.map((user) => ({ ...publicUser(user), ticketCount: user.ticketCount })));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/audit — most recent account actions, administration only.
router.get('/audit', adminOnly, async (req, res, next) => {
  try {
    const events = await AuditEvent.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actor', 'name email')
      .lean();
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// POST /api/users — administration creates an employee or IT support login.
router.post('/', adminOnly, async (req, res, next) => {
  const role = req.body?.role || 'support';
  if (!ACCOUNT_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be employee or support.' });
  }
  const parsed = parseAccount(req.body, { companyOnly: true });
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const user = await User.create({
      name: parsed.values.name,
      email: parsed.values.email,
      passwordHash: await hashPassword(parsed.values.password),
      role,
      mustChangePassword: true,
      temporaryPasswordExpiresAt: temporaryPasswordExpiry(),
    });
    await recordAudit(req.user._id, 'account.create', user._id, {
      role,
      email: user.email,
    });
    const payload = publicUser(user);
    if (role === 'employee') payload.ticketCount = 0;
    res.status(201).json(payload);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }
    next(err);
  }
});

// PATCH /api/users/:id — administration updates an account name or email.
router.patch('/:id', adminOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid account id.' });
  }
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
  const email = normalizeEmail(req.body?.email);
  if (!name || name.length > 80) {
    return res.status(400).json({ error: 'A name of 80 characters or fewer is required.' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }

  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ACCOUNT_ROLES },
      deletedAt: null,
    });
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    if (!email.endsWith(COMPANY_DOMAIN)) {
      return res.status(400).json({ error: 'Use a @company.com email address.' });
    }
    user.name = name;
    user.email = email;
    await user.save();
    await recordAudit(req.user._id, 'account.update', user._id, { email: user.email });
    res.json(publicUser(user));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'That email is already registered.' });
    }
    next(err);
  }
});

// PUT /api/users/:id/password — administration resets an account password.
router.put('/:id/password', adminOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid account id.' });
  }
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ACCOUNT_ROLES },
      deletedAt: null,
    });
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    const password = crypto.randomBytes(9).toString('base64url');
    user.passwordHash = await hashPassword(password);
    user.mustChangePassword = true;
    user.temporaryPasswordExpiresAt = temporaryPasswordExpiry();
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await recordAudit(req.user._id, 'account.password_reset', user._id, {
      email: user.email,
    });
    res.json({ message: 'Password reset.', password });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id/active — administration deactivates/reactivates an employee.
router.patch('/:id/active', adminOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid account id.' });
  }
  if (typeof req.body?.active !== 'boolean') {
    return res.status(400).json({ error: 'Active must be true or false.' });
  }

  try {
    const user = await User.findOne({ _id: req.params.id, role: 'employee', deletedAt: null });
    if (!user) return res.status(404).json({ error: 'Employee account not found.' });
    if (!req.body.active && user.active !== false) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    user.active = req.body.active;
    await user.save();
    await recordAudit(
      req.user._id,
      user.active ? 'account.activate' : 'account.deactivate',
      user._id,
      { email: user.email }
    );
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — support is removable; employees only without tickets.
router.delete('/:id', adminOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid account id.' });
  }
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ACCOUNT_ROLES },
      deletedAt: null,
    });
    if (!user) return res.status(404).json({ error: 'Account not found.' });

    if (user.role === 'employee') {
      const tickets = await Ticket.countDocuments({ createdBy: user._id });
      if (tickets > 0) {
        return res
          .status(409)
          .json({ error: 'This employee has tickets. Deactivate the account instead.' });
      }
      await recordAudit(req.user._id, 'account.delete', user._id, {
        role: user.role,
        email: user.email,
      });
      await user.deleteOne();
      return res.json({ message: 'Employee account removed.' });
    }

    await recordAudit(req.user._id, 'account.delete', user._id, {
      role: user.role,
      email: user.email,
    });
    await user.deleteOne();
    res.json({ message: 'IT support account removed.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
