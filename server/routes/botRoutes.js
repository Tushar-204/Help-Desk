const express = require('express');
const { CATEGORIES, findCategory, alreadyShown } = require('../bot/instructions');
const { askGemini } = require('../bot/gemini');
const { createTurnCounter, MAX_TURNS } = require('../bot/turns');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
const turnCounter = createTurnCounter();

const chatLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 20,
  key: (req) => String(req.user?._id || req.ip),
  message: 'Too many assistant messages. Please wait a few minutes.',
});

function fallbackReply(match, repeat) {
  if (!match) {
    return 'Could you tell me a bit more about the problem — which device or app is affected, and what happens when you try it?';
  }
  if (repeat) {
    return `Those steps cover the usual fixes for ${match.category.toLowerCase()} problems. What happens when you try them — do you get any error message?`;
  }
  return 'Please try these steps:';
}

// POST /api/bot/message
router.post('/message', chatLimiter, async (req, res, next) => {
  const { message, history, seenSteps, topic } = req.body || {};

  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Please describe your problem.' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message must be 1000 characters or fewer.' });
  }

  const turns = turnCounter.take(req.user._id);

  // Keep the chat on the first detected topic so "still broken" replies don't
  // false-match a different category.
  const locked = CATEGORIES.find((cat) => cat.name === topic);
  const match = locked ? { category: locked.name, steps: locked.steps } : findCategory(message);
  const repeat = alreadyShown(match, seenSteps);

  if (turns >= MAX_TURNS) {
    return res.json({
      category: match?.category || null,
      reply:
        "I've done my best, but this needs a human. Let's create a support ticket so our IT team can take it from here.",
      steps: [],
      escalate: true,
      maxTurns: MAX_TURNS,
    });
  }

  try {
    const aiReply = await askGemini({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      steps: match ? { topic: match.category, list: match.steps, tried: repeat } : null,
    });

    res.json({
      category: match?.category || null,
      reply: aiReply || fallbackReply(match, repeat),
      steps: repeat ? [] : match?.steps || [],
      escalate: false,
      maxTurns: MAX_TURNS,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/bot/instructions — powers quick-help chips, ticket categories, knowledge base.
router.get('/instructions', (req, res) => {
  res.json(CATEGORIES);
});

module.exports = router;
