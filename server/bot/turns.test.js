const test = require('node:test');
const assert = require('node:assert');
const { createTurnCounter } = require('./turns');

test('turn counter enforces the limit per user and resets after the TTL', () => {
  let clock = 0;
  const counter = createTurnCounter({ max: 3, ttl: 1000, now: () => clock });

  assert.equal(counter.take('user-a'), 1);
  assert.equal(counter.take('user-a'), 2);
  assert.equal(counter.take('user-a'), 3);
  assert.equal(counter.take('user-a'), 4);
  assert.equal(counter.take('user-b'), 1);

  clock += 1001;
  assert.equal(counter.take('user-a'), 1);
});
