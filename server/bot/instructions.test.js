const { test } = require('node:test');
const assert = require('node:assert');
const { findCategory } = require('./instructions');

test('matches login problems', () => {
  assert.strictEqual(findCategory('I cannot login').category, 'Login');
});

test('matches password problems', () => {
  assert.strictEqual(findCategory('I forgot my password').category, 'Password');
});

test('matches payment problems', () => {
  assert.strictEqual(findCategory('my payment was declined').category, 'Payment');
});

test('matches internet problems', () => {
  assert.strictEqual(findCategory('wifi keeps disconnecting').category, 'Internet');
});

test('matches application errors', () => {
  assert.strictEqual(findCategory('the page shows an error').category, 'Application Error');
});

test('returns steps for a match', () => {
  const r = findCategory('cannot login to my account');
  assert.ok(r.steps.length > 0);
});

test('returns null when nothing matches', () => {
  assert.strictEqual(findCategory('tell me a joke'), null);
  assert.strictEqual(findCategory(''), null);
});
