const test = require('node:test');
const assert = require('node:assert');
const { rateLimit } = require('./middleware/rateLimit');
const { EMPLOYEE_CREATE_FIELDS, STAFF_UPDATE_FIELDS, pickFields } = require('./ticketFields');

function hit(limiter) {
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
    set() {
      return this;
    },
  };
  limiter({}, res, () => {
    nextCalled = true;
  });
  return { status, nextCalled };
}

test('employee ticket creation cannot set workflow fields', () => {
  const values = pickFields(
    { title: 'Printer', status: 'Resolved', assignedTo: 'Boss', priority: 'High' },
    EMPLOYEE_CREATE_FIELDS
  );
  assert.deepEqual(values, { title: 'Printer', priority: 'High' });
});

test('staff updates are limited to workflow fields', () => {
  const values = pickFields(
    { title: 'Changed', description: 'Changed', status: 'Resolved', assignedTo: 'Riya' },
    STAFF_UPDATE_FIELDS
  );
  assert.deepEqual(values, { status: 'Resolved', assignedTo: 'Riya' });
});

test('rate limiter blocks over the limit and resets after the window', () => {
  let clock = 0;
  const limiter = rateLimit({ windowMs: 1000, limit: 2, key: () => 'k', now: () => clock });

  assert.equal(hit(limiter).nextCalled, true);
  assert.equal(hit(limiter).nextCalled, true);
  assert.equal(hit(limiter).status, 429);

  clock += 1001;
  assert.equal(hit(limiter).nextCalled, true);
});
