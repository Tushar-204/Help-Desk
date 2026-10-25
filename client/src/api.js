import axios from 'axios';

// Vite proxies /api to the Express server (see vite.config.js)
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const session = loadSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

export function loadSession() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const session = JSON.parse(store.getItem('helpdesk_session') || 'null');
      if (session?.token) return session;
    } catch {
      // corrupted entry, ignore
    }
  }
  return null;
}

export function saveSession(session, remember) {
  clearSession();
  (remember ? localStorage : sessionStorage).setItem('helpdesk_session', JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem('helpdesk_session');
  sessionStorage.removeItem('helpdesk_session');
}

export default api;
