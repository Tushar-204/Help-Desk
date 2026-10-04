// Rule-based troubleshooting steps, matched by simple keyword scan.
const CATEGORIES = [
  {
    name: 'Login',
    keywords: ['login', 'log in', 'log-in', 'signin', 'sign in', 'cannot access', 'locked out', 'account'],
    steps: [
      'Check that your email and password are entered correctly.',
      'Make sure Caps Lock is off.',
      'Try logging in from a different browser or device.',
      'Clear your browser cache and try again.',
      'Try logging in again.',
    ],
  },
  {
    name: 'Password',
    keywords: ['password', 'reset', 'forgot', 'change pass', 'otp', 'verification code'],
    steps: [
      'Click the "Forgot password" link on the login page.',
      'Check your email (including spam) for the reset link.',
      'Create a new password with at least 8 characters.',
      'Clear your browser cache.',
      'Try logging in with the new password.',
    ],
  },
  {
    name: 'Payment',
    keywords: ['payment', 'pay', 'billing', 'charge', 'card', 'invoice', 'refund', 'transaction'],
    steps: [
      'Check that your card details and expiry date are correct.',
      'Make sure you have enough balance or credit available.',
      'Try a different payment method.',
      'Disable any VPN or ad blocker and retry.',
      'Check your email for a payment confirmation or error message.',
    ],
  },
  {
    name: 'Internet',
    keywords: ['internet', 'wifi', 'wi-fi', 'network', 'connection', 'offline', 'slow', 'disconnect', 'router'],
    steps: [
      'Check that your internet connection is working.',
      'Restart your router or modem.',
      'Move closer to the router or use a wired connection.',
      'Close other apps or tabs using heavy bandwidth.',
      'Restart your browser and try again.',
    ],
  },
  {
    name: 'Application Error',
    keywords: ['error', 'crash', 'crashes', 'bug', 'freeze', 'frozen', 'not working', 'fails', 'failure', 'exception', 'blank screen'],
    steps: [
      'Note the exact error message and when it appears.',
      'Refresh the page or restart the application.',
      'Clear your browser cache and reload.',
      'Update the application to the latest version.',
      'Try the same action in an incognito/private window.',
    ],
  },
];

function findCategory(message = '') {
  const text = String(message).toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const cat of CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (text.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }

  if (!best) return null;
  return { category: best.name, steps: best.steps };
}

module.exports = { CATEGORIES, findCategory };
