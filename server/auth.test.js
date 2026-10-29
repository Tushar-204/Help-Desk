const test = require('node:test');
const assert = require('node:assert');
const {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  temporaryPasswordExpiry,
  temporaryPasswordExpired,
  adminOnly,
  staffOnly,
} = require('./auth');

function run(middleware, role) {
  let status = 200;
  let nextCalled = false;
  const res = {
    status(code) {
      status = code;
      return this;
    },
    json() {
      return this;
    },
  };
  middleware({ user: { role } }, res, () => {
    nextCalled = true;
  });
  return { status, nextCalled };
}

test('password hash verifies only the right password', async () => {
  const stored = await hashPassword('secret123');
  assert.equal(await verifyPassword('secret123', stored), true);
  assert.equal(await verifyPassword('wrong', stored), false);
  assert.equal(await verifyPassword('secret123', 'garbage'), false);
});

test('signed token round-trips and rejects tampering', () => {
  const token = signToken({ _id: '507f1f77bcf86cd799439011', tokenVersion: 3 });
  const payload = verifyToken(token);
  assert.equal(payload.sub, '507f1f77bcf86cd799439011');
  assert.equal(payload.v, 3);
  assert.ok(payload.exp > Date.now());

  const [body, sig] = token.split('.');
  assert.equal(verifyToken(`${body}x.${sig}`), null);
  assert.equal(verifyToken(`${body}.${sig}x`), null);
  assert.equal(verifyToken(''), null);
});

test('temporary passwords expire after seven days', () => {
  const start = Date.now();
  const expiresAt = temporaryPasswordExpiry(start);

  assert.equal(temporaryPasswordExpired(expiresAt, start), false);
  assert.equal(temporaryPasswordExpired(expiresAt, start + 7 * 24 * 60 * 60 * 1000 - 1), false);
  assert.equal(temporaryPasswordExpired(expiresAt, start + 7 * 24 * 60 * 60 * 1000), true);
  assert.equal(temporaryPasswordExpired(null, start), false);
});

test('support routes allow IT support and administration, not employees', () => {
  assert.equal(run(staffOnly, 'support').nextCalled, true);
  assert.equal(run(staffOnly, 'admin').nextCalled, true);
  assert.equal(run(staffOnly, 'employee').nextCalled, false);
  assert.equal(run(staffOnly, 'employee').status, 403);
  assert.equal(run(adminOnly, 'support').nextCalled, false);
  assert.equal(run(adminOnly, 'admin').nextCalled, true);
});
