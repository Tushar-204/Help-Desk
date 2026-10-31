# HelpDesk — IT Support Portal

A full-stack internal helpdesk demo: employees chat with an AI assistant, raise tickets, and track replies; IT support works the queue; administrators manage accounts.

[Project complete analysis (PDF)](Help_Desk_Project_Complete_Analysis.pdf)

## Features

- Employee, IT support, and administrator roles
- Clear role split: Administration manages accounts; IT Support works the ticket queue
- AI-guided troubleshooting with Gemini, plus a built-in rule-based fallback
- Ask the assistant for a ticket at any point in the conversation
- Ticket creation, conversation threads, status and priority tracking
- Support queue with search and status filters
- In-app notifications and activity polling
- Account creation, password resets, deactivation, and temporary-password expiry
- Admin audit trail for account actions
- Session revocation after password changes or deactivation
- Responsive React interface served by Express on one port

## Stack

- **Frontend:** React 18, Vite, Axios
- **Backend:** Node.js, Express, Mongoose
- **Database:** MongoDB
- **AI:** Google Gemini API (optional; falls back to local troubleshooting steps)

## Quick Start

Prerequisites: Node.js 20+ and a running MongoDB instance on `127.0.0.1:27017`.

```bash
# Install
cd server && npm install
cd ../client && npm install

# Create local config
cp -n ../server/.env.example ../server/.env
# Set AUTH_SECRET (required) and optionally GEMINI_API_KEY

# Build the client once
npm run build

# Start the app
cd ../server
npm start
```

Open `http://127.0.0.1:5000`.

`AUTH_SECRET` must be at least 32 characters. Generate one with:

```bash
openssl rand -hex 32
```

## Demo Mode

The repository includes a demo data seeder so the dashboard and queue look realistic. Build the client first if you have not already:

```bash
cd client && npm run build
cd ../server
npm run demo
```

This seeds `helpdesk_demo` in MongoDB (without touching your main `helpdesk` database) and starts the app at `http://127.0.0.1:5000`. Stop any existing server first. The seeder prints the generated demo credentials in the terminal; they are intentionally not listed in this public README.

The login screen can display demo credentials when `SEED_DEMO=true`. Never enable demo mode on a public deployment.

## How to Log In

Select the login tab that matches the account type. Signing in through the wrong tab is rejected.

| Role | Login tab | Where the credentials come from | After login |
| --- | --- | --- | --- |
| Employee | Employee | Self-registration with a company email, or an account created by Administration | Dashboard, AI Support, My Tickets |
| IT Support | IT Support | An account created by Administration; the first password is temporary | Change password, then Support Queue |
| Administration | Administration | `ADMIN_EMAIL` and `ADMIN_PASSWORD` configured on the server | Manage Employees and Manage IT Support |

### Local demo login

1. Start the backend:
   ```bash
   cd server
   npm run demo
   ```
2. Open `http://localhost:5000`, or start the Vite frontend separately:
   ```bash
   cd client
   npm run dev
   ```
   Then use `http://localhost:3000`.
3. Use the employee, IT support, or admin credentials printed by the seeder.
4. If the account was created with a temporary password, complete the Settings screen before the role dashboard opens.

### Production login

- **Administration:** the first server boot creates the admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Sign in through the Administration tab, then change the password in Settings. The admin manages employee and IT support accounts but does not work the Support Queue.
- **IT Support:** the admin creates the account in Manage IT Support and shares the temporary password. Sign in through the IT Support tab and change the password; the Support Queue then becomes available.
- **Employee:** self-register with a company email, or let the admin create the account in Manage Employees. Sign in through the Employee tab.

Do not use demo accounts, demo passwords, or `SEED_DEMO=true` in production.

## Interview Walkthrough

1. Sign in through the Employee tab and open **AI Support**.
2. Describe an issue such as “My printer is not working”; show the troubleshooting steps.
3. Ask the assistant to create a ticket, or continue until it offers the ticket form.
4. Sign out and sign in through the IT Support tab; open **Support Queue**, reply to the ticket, and change its status.
5. Sign out and sign in through the Administration tab to show account management, password reset, and deactivation.
6. Open **Settings** to show the forced password-change flow and session handling.

## Scripts

Run from the listed directory:

```bash
# server
npm start        # serve the API and built client
npm run demo     # seed the demo database and start the app
npm run demo:seed
npm test         # node:test unit tests

# client
npm run dev      # Vite dev server with /api proxy
npm run build    # production build into client/dist
```

## Project Structure

```text
client/                 React app
  src/components/       Pages and UI components
  dist/                 Production build (generated; ignored by git)
server/
  routes/               Auth, tickets, users, bot API
  models/               User, Ticket, AuditEvent
  bot/                  Gemini client, rules, turn counter
  middleware/           In-memory rate limiting
  scripts/seed-demo.js  Demo database seeder
  server.js             Express app and startup
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for the Render API + Vercel frontend guide, a single-service Render setup, and a VPS/Nginx/systemd setup.

## Configuration

See `server/.env.example`. Important variables:

- `PORT` — API/UI port (default `5000`)
- `MONGO_URI` — MongoDB connection string
- `AUTH_SECRET` — required, 32+ characters
- `SEED_DEMO` — set `true` only for local demo data
- `GEMINI_API_KEY` — optional; without it the rule-based assistant is used
- `GEMINI_MODEL` — defaults to `gemini-3.6-flash`
- `CLIENT_ORIGIN` — optional comma-separated CORS allowlist for a separate frontend
- `TRUST_PROXY` — optional when running behind a reverse proxy
- `SERVE_CLIENT` — set `false` when the frontend is hosted separately, such as on Vercel
- `VITE_API_URL` — client build-time API URL when the frontend is hosted separately, for example `https://your-api.onrender.com/api`

`server/.env` is gitignored and may contain API keys. Never commit or share it.

## Known Limitations

This is a portfolio/demo build, not a production deployment:

- Demo accounts use known passwords and must not be exposed publicly.
- There is no email delivery, so password recovery is handled by an administrator.
- Ticket lists are not paginated; the demo dataset is intentionally small.
- The in-memory rate limiter and AI turn counter reset when the server restarts.
- The app uses HTTP locally; put it behind HTTPS before any real deployment.
- MongoDB must already be running before starting the app.
