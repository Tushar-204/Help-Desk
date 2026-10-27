// ponytail: in-process fixed-window limiter. Move to a shared store if the API
// ever runs more than one instance.
function rateLimit({
  windowMs,
  limit,
  key = (req) => req.ip,
  message = 'Too many requests. Please try again later.',
  now = Date.now,
}) {
  const hits = new Map();

  const sweep = setInterval(() => {
    const t = now();
    for (const [k, entry] of hits) {
      if (entry.reset <= t) hits.delete(k);
    }
  }, windowMs);
  sweep.unref?.();

  return function limiter(req, res, next) {
    const t = now();
    const k = key(req);
    let entry = hits.get(k);
    if (!entry || entry.reset <= t) {
      entry = { count: 0, reset: t + windowMs };
      hits.set(k, entry);
    }

    entry.count += 1;
    if (entry.count > limit) {
      if (res.set) res.set('Retry-After', String(Math.ceil((entry.reset - t) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  };
}

module.exports = { rateLimit };
