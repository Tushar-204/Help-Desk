# Deployment Guide

This app can run as one Node/Express service that serves both the API and the built React client, or as a split deployment with **Render for the API and Vercel for the frontend**. The split setup is first below, followed by the single-service Render option and a VPS/Nginx option.

## Before You Deploy

1. Commit and push the current code. Render and Vercel deploy from GitHub; an unpushed local commit is ignored.
2. MongoDB is running somewhere reachable from the app.
3. `client/dist` has been built, unless `SERVE_CLIENT=false` is set for a split frontend.
4. `server/.env` is **not** committed.
5. `SEED_DEMO=false`. Never enable demo accounts on a public deployment.
6. Generate a production secret:

```bash
openssl rand -hex 32
```

## Option A — Render API + Vercel frontend

This is the split setup: Render runs the Express API, Vercel serves the React build, and MongoDB Atlas stores the data.

### 1. Create the MongoDB database

1. Create a free MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Add a network allowlist entry. For a quick demo, `0.0.0.0/0` works; restrict it if your host has stable outbound IPs.
4. Copy the driver connection string and include a database name, for example:

```text
mongodb+srv://helpdesk_user:URL_ENCODED_PASSWORD@cluster0.example.mongodb.net/helpdesk?retryWrites=true&w=majority
```

If the password contains special characters, URL-encode them.

### 2. Deploy the API on Render

- **Runtime:** Node
- **Build command:**

```bash
cd server && npm ci --omit=dev
```

- **Start command:**

```bash
node server/server.js
```

Set these environment variables on Render:

| Variable | Required | Value |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `AUTH_SECRET` | yes | 32+ random characters |
| `MONGO_URI` | yes | Atlas connection string |
| `SEED_DEMO` | yes | `false` |
| `SERVE_CLIENT` | yes | `false` |
| `CLIENT_ORIGIN` | yes | your Vercel URL, set after step 3 |
| `ADMIN_EMAIL` | first boot | admin email |
| `ADMIN_PASSWORD` | first boot | strong admin password |
| `ADMIN_NAME` | no | display name, default `Administrator` |
| `GEMINI_API_KEY` | no | enables Gemini; without it the local fallback is used |
| `GEMINI_MODEL` | no | default `gemini-3.6-flash` |
| `TRUST_PROXY` | recommended | `1` on Render |
| `PORT` | no | set by Render automatically |

Do not set `PORT` manually. The API health endpoint is:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

Expect `"clientBuild": false` in this split setup; that is correct because Vercel serves the frontend.

### 3. Deploy the frontend on Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `client`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add this environment variable for Production (and Preview if you use preview URLs):

```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

`VITE_API_URL` is compiled into the frontend at build time. Redeploy Vercel whenever you change it. `client/vercel.json` handles SPA fallback paths.

### 4. Connect the two deployments

After Vercel gives you a production URL, go back to Render and set:

```text
CLIENT_ORIGIN=https://your-project.vercel.app
```

Use the exact origin, including `https://` and without a trailing slash. If you also use preview deployments, add each preview origin comma-separated:

```text
CLIENT_ORIGIN=https://your-project.vercel.app,https://your-preview-abc.vercel.app
```

Redeploy or restart the Render service after changing this value. If login requests fail with a CORS error, check that the origin in the browser matches `CLIENT_ORIGIN` exactly.

### 5. First login

On the first boot, the API creates the admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Public registration is disabled (`503`) until an administrator exists.

After logging in:

1. Change the admin password in **Settings**.
2. Remove `ADMIN_PASSWORD` from Render after the admin exists.
3. Create IT support and employee accounts in Administration.

### 6. Final checks

1. Open the Vercel URL and confirm the login page loads.
2. Sign in as admin; if the API is cold-starting, the first request may take up to a minute.
3. Create a ticket as an employee, reply as support, and change its status.
4. Confirm `https://YOUR-RENDER-SERVICE.onrender.com/api/health` returns `200`.
5. Confirm the browser network tab shows API requests going to `onrender.com`, not Vercel.

## Option B — Render + MongoDB Atlas (single service)

The Render service serves both the API and the built React client.

### 1. Create the MongoDB database

1. Create a free MongoDB Atlas cluster.
2. Create a database user with a strong password.
3. Add a network allowlist entry. For a quick demo, `0.0.0.0/0` works; restrict it if your host has stable outbound IPs.
4. Copy the driver connection string and include a database name, for example:

```text
mongodb+srv://helpdesk_user:URL_ENCODED_PASSWORD@cluster0.example.mongodb.net/helpdesk?retryWrites=true&w=majority
```

If the password contains special characters, URL-encode them.

### 2. Create the Render web service

- **Runtime:** Node
- **Build command:**

```bash
cd client && npm ci --include=dev && npm run build && cd ../server && npm ci --omit=dev
```

- **Start command:**

```bash
node server/server.js
```

`client/dist` is built into the deploy workspace and served by Express from `../client/dist`.

### 3. Set environment variables

| Variable | Required | Value |
| --- | --- | --- |
| `NODE_ENV` | yes | `production` |
| `AUTH_SECRET` | yes | 32+ random characters |
| `MONGO_URI` | yes | Atlas connection string |
| `SEED_DEMO` | yes | `false` |
| `ADMIN_EMAIL` | first boot | admin email |
| `ADMIN_PASSWORD` | first boot | strong admin password |
| `ADMIN_NAME` | no | display name, default `Administrator` |
| `GEMINI_API_KEY` | no | enables Gemini; without it the local fallback is used |
| `GEMINI_MODEL` | no | default `gemini-3.6-flash` |
| `TRUST_PROXY` | recommended | `1` on Render |
| `CLIENT_ORIGIN` | no | only for a separately hosted frontend |
| `PORT` | no | set by Render automatically |

Do not set `PORT` manually on Render.

### 4. First login

On the first boot, `ensureAdmin()` creates the admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Public registration is disabled (`503`) until an administrator exists.

After logging in:

1. Change the admin password in **Settings**.
2. Remove `ADMIN_PASSWORD` from the Render environment after the admin exists. It is ignored once an admin is present, but it should not remain in the dashboard longer than needed.
3. Create IT support and employee accounts from **Manage IT Support** and **Manage Employees**.
4. Set the health check path to:

```text
/api/health
```

## Option C — VPS + Nginx + systemd

Use this when you want the app on your own server.

### 1. Build and configure

```bash
sudo apt update
sudo apt install -y nginx
# Install Node.js 20+ first

sudo mkdir -p /opt/helpdesk
sudo chown -R "$USER":"$USER" /opt/helpdesk
git clone https://github.com/Tushar-204/Help-Desk.git /opt/helpdesk
cd /opt/helpdesk

cd client && npm ci && npm run build
cd ../server && npm ci --omit=dev
```

Create `/opt/helpdesk/server/.env` from `.env.example` and set:

```dotenv
NODE_ENV=production
AUTH_SECRET=replace-with-a-32-plus-character-secret
MONGO_URI=mongodb+srv://...
SEED_DEMO=false
SERVE_CLIENT=true
ADMIN_EMAIL=admin@your-domain.com
ADMIN_PASSWORD=replace-with-a-strong-password
TRUST_PROXY=1
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash
```

### 2. Run it as a service

Create `/etc/systemd/system/helpdesk.service`:

```ini
[Unit]
Description=HelpDesk
After=network.target

[Service]
Type=simple
User=helpdesk
WorkingDirectory=/opt/helpdesk/server
EnvironmentFile=/opt/helpdesk/server/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now helpdesk
sudo systemctl status helpdesk
```

Replace `User=helpdesk` with a real non-root service user, and make sure it can read `/opt/helpdesk/server/.env` and `client/dist`.

### 3. Put Nginx and HTTPS in front

Example `/etc/nginx/sites-available/helpdesk`:

```nginx
server {
    listen 80;
    server_name helpdesk.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and get a certificate:

```bash
sudo ln -s /etc/nginx/sites-available/helpdesk /etc/nginx/sites-enabled/helpdesk
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d helpdesk.example.com
```

Only expose ports `80` and `443`; keep `5000` and MongoDB private.

## Production Checks

After deployment:

```bash
curl -i https://your-domain.com/api/health
```

Expected: `200` with `"ok": true`, `"demoMode": false`. In the split Render + Vercel setup, `"clientBuild": false` is expected; in the single-service setup it should be `true`.

Then test:

1. Admin login and password change.
2. Create an employee and IT support account.
3. Employee login, ticket creation, AI support.
4. Support queue reply and status change.
5. Refresh a ticket page; the app should still load.
6. Confirm `http://` redirects to HTTPS.

## Render Troubleshooting

### `client/dist/index.html not found`
- **Render API + Vercel frontend:** set `SERVE_CLIENT=false` on Render. The API does not need the frontend build.
- **Single Render service:** use the build command from Option B so `client/dist` is created before the server starts.

### Render exits with status `1` before listening
- Check that `MONGO_URI` is set to the Atlas URI and that Atlas allows Render’s network.
- Check the Render logs for `MongoDB connected`. If that line is missing, the API never opened its port.
- Confirm `AUTH_SECRET` is at least 32 characters.
- Confirm the start command is `node server/server.js` and the build command finished successfully.
- If Render asks for a port, do not set one manually; it is provided automatically.

### Vercel loads but login fails
- Confirm `VITE_API_URL` is `https://YOUR-API.onrender.com/api` and redeploy Vercel after changing it.
- Confirm Render’s `CLIENT_ORIGIN` exactly matches the Vercel origin, including `https://`.
- Check the browser Network tab: API requests should go to `onrender.com`, not the Vercel domain.
- A Render free instance may be cold-starting; the first request can take up to a minute.

## Important Limitations

- **Single instance only for rate limiting and AI turn counting.** Both use in-memory maps. If you run multiple instances, move them to Redis or another shared store.
- **No email delivery.** Password reset is admin-driven; there is no self-service email reset.
- **No pagination.** Ticket lists are intended for small teams/demo data.
- **Demo mode is public by design.** Keep `SEED_DEMO=false` and never use demo credentials in production.
- The local MongoDB kernel/service issue on the development machine is not part of a hosted deployment; using Atlas avoids it.
