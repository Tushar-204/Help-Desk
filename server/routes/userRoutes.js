const crypto = require('crypto');
const express = require('express');
const { isValidObjectId } = require('mongoose');
const { User } = require('../models/User');
const { Ticket } = require('../models/Ticket');
const { hashPassword, adminOnly } = require('../auth');
const { parseAccount } = require('../accountRules');

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
      const users = await User.find({ role })
        .select('name email role active createdAt')
        .sort({ createdAt: 1 });
      return res.json(users.map(publicUser));
    }

    const users = await User.aggregate([
      { $match: { role: 'employee' } },
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

// POST /api/users — administration creates an employee or IT support login.
router.post('/', adminOnly, async (req, res, next) => {
  const role = req.body?.role || 'support';
  if (!ACCOUNT_ROLES.includes(role)) {
    return res.status(400).json({ error: 'Role must be employee or support.' });
  }
  const parsed = parseAccount(req.body, { companyOnly: role === 'employee' });
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  try {
    const user = await User.create({
      name: parsed.values.name,
      email: parsed.values.email,
      passwordHash: await hashPassword(parsed.values.password),
      role,
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

// PUT /api/users/:id/password — administration resets an account password.
router.put('/:id/password', adminOnly, async (req, res, next) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({ error: 'Invalid account id.' });
  }
  try {
    const user = await User.findOne({
      _id: req.params.id,
      role: { $in: ACCOUNT_ROLES },
    });
    if (!user) return res.status(404).json({ error: 'Account not found.' });
    const password = crypto.randomBytes(9).toString('base64url');
    user.passwordHash = await hashPassword(password);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
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
    const user = await User.findOne({ _id: req.params.id, role: 'employee' });
    if (!user) return res.status(404).json({ error: 'Employee account not found.' });
    if (!req.body.active && user.active !== false) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    user.active = req.body.active;
    await user.save();
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
    const user = await User.findById(req.params.id);
    if (!user || !ACCOUNT_ROLES.includes(user.role)) {
      return res.status(404).json({ error: 'Account not found.' });
    }
    if (user.role === 'employee') {
      const tickets = await Ticket.countDocuments({ createdBy: user._id });
      if (tickets > 0) {
        return res
          .status(409)
          .json({ error: 'This employee has tickets. Deactivate the account instead.' });
      }
    }
    await user.deleteOne();
    res.json({
      message:
        user.role === 'employee' ? 'Employee account removed.' : 'IT support account removed.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
