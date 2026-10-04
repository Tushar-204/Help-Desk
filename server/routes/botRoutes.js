const express = require('express');
const { findCategory } = require('../bot/instructions');

const router = express.Router();

router.post('/message', (req, res) => {
  const { message } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'Please describe your problem.' });
  }

  const match = findCategory(message);

  if (!match) {
    return res.json({
      category: null,
      reply: 'Sorry, I could not match your problem. Technical support is available — please create a support ticket and our staff will help you.',
      steps: [],
    });
  }

  res.json({
    category: match.category,
    reply: 'Please try these steps:',
    steps: match.steps,
  });
});

module.exports = router;
