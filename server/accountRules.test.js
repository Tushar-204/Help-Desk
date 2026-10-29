const test = require('node:test');
const assert = require('node:assert');
const { parseAccount } = require('./accountRules');

test('employee registration requires a company email', () => {
  const ok = parseAccount(
    { name: 'Test User', email: 'Test.User@COMPANY.COM', password: 'password123' },
    { companyOnly: true }
  );
  assert.equal(ok.error, undefined);
  assert.equal(ok.values.email, 'test.user@company.com');
  assert.equal(ok.values.name, 'Test User');

  const wrongDomain = parseAccount(
    { name: 'Test User', email: 'test@example.com', password: 'password123' },
    { companyOnly: true }
  );
  assert.match(wrongDomain.error, /@company\.com/);
});

test('account validation rejects bad names, emails, and passwords', () => {
  assert.ok(parseAccount({ name: '', email: 'a@company.com', password: 'password123' }).error);
  assert.ok(parseAccount({ name: 'A', email: 'not-an-email', password: 'password123' }).error);
  assert.ok(parseAccount({ name: 'A', email: 'a@company.com', password: 'short' }).error);
  assert.ok(
    parseAccount({ name: 'A', email: 'a@company.com', password: 'x'.repeat(129) }).error
  );
});

test('non-company accounts can use any valid email', () => {
  const parsed = parseAccount({
    name: 'Support Agent',
    email: 'agent@vendor.example',
    password: 'password123',
  });
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.values.email, 'agent@vendor.example');
});
