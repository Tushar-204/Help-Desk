const test = require('node:test');
const assert = require('node:assert');
const { buildTurns } = require('./gemini');

test('Gemini history drops a leading greeting and keeps user-first turns', () => {
  assert.deepEqual(
    buildTurns([
      { from: 'bot', text: 'Hi there' },
      { from: 'user', text: 'My Wi-Fi is down' },
      { from: 'bot', text: 'Try restarting it' },
    ]),
    [
      { role: 'user', parts: [{ text: 'My Wi-Fi is down' }] },
      { role: 'model', parts: [{ text: 'Try restarting it' }] },
    ]
  );
});

test('Gemini history merges consecutive same-role turns', () => {
  assert.deepEqual(
    buildTurns([
      { from: 'user', text: 'First' },
      { from: 'user', text: 'Second' },
      { from: 'bot', text: 'Reply' },
    ]),
    [
      { role: 'user', parts: [{ text: 'First\nSecond' }] },
      { role: 'model', parts: [{ text: 'Reply' }] },
    ]
  );
});
