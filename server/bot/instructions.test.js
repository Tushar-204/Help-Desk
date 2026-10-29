const { test } = require('node:test');
const assert = require('node:assert');
const { findCategory, alreadyShown } = require('./instructions');

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

test('matches hardware problems', () => {
  assert.strictEqual(findCategory('my printer is not working').category, 'Hardware');
  assert.strictEqual(findCategory('my computer is running very slow').category, 'Hardware');
});

test('matches email problems', () => {
  assert.strictEqual(findCategory('I cannot send or receive emails').category, 'Email');
});

test('password steps point to Settings and Administration', () => {
  const { steps } = findCategory('I forgot my password');
  assert.ok(steps.some((step) => step.includes('Settings')));
  assert.ok(steps.some((step) => step.includes('admin@company.com')));
});

test('matches application errors', () => {
  assert.strictEqual(findCategory('the page shows an error').category, 'Application Error');
});

test('returns steps for a match', () => {
  const r = findCategory('cannot login to my account');
  assert.ok(r.steps.length > 0);
});

test('returns null when nothing matches', () => {
  assert.equal(findCategory('hello there'), null);
});

test('detects troubleshooting steps already shown', () => {
  const match = findCategory('my wifi is down');
  assert.equal(alreadyShown(match, []), false);
  assert.equal(alreadyShown(match, [match.steps[0]]), true);
  assert.equal(alreadyShown(null, ['anything']), false);
});
