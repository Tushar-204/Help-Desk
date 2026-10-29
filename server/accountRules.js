const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPANY_DOMAIN = '@company.com';

function parseAccount(body = {}, { companyOnly = false } = {}) {
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) {
    return { error: 'A name of 80 characters or fewer is required.' };
  }
  if (typeof body.email !== 'string' || !EMAIL_RE.test(body.email.trim())) {
    return { error: 'A valid email is required.' };
  }

  const email = body.email.trim().toLowerCase();
  if (companyOnly && !email.endsWith(COMPANY_DOMAIN)) {
    return { error: 'Use your @company.com email address.' };
  }
  if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
    return { error: 'Password must be 8 to 128 characters.' };
  }

  return {
    values: {
      name: body.name.trim(),
      email,
      password: body.password,
    },
  };
}

module.exports = { parseAccount, COMPANY_DOMAIN, EMAIL_RE };
