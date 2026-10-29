const MAX_TURNS = 10;
const TTL_MS = 60 * 60 * 1000;

function createTurnCounter({ max = MAX_TURNS, ttl = TTL_MS, now = Date.now } = {}) {
  const sessions = new Map();

  return {
    take(userId) {
      const key = String(userId);
      const t = now();
      let session = sessions.get(key);
      if (!session || session.expires <= t) session = { count: 0, expires: t + ttl };
      session.count += 1;
      session.expires = t + ttl;
      sessions.set(key, session);
      return session.count;
    },
    max,
  };
}

module.exports = { createTurnCounter, MAX_TURNS };
