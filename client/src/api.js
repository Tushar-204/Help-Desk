import axios from 'axios';

// Vite proxies /api to the Express server (see vite.config.js)
const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use((config) => {
  const session = loadSession();
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      clearSession();
      window.dispatchEvent(new Event('helpdesk:unauthorized'));
    }
    return Promise.reject(error);
  }
);

function isTokenExpired(token) {
  try {
    const body = token.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
    const padded = body + '='.repeat((4 - (body.length % 4)) % 4);
    const { exp } = JSON.parse(atob(padded));
    return !exp || exp <= Date.now();
  } catch {
    return true;
  }
}

export function loadSession() {
  for (const store of [localStorage, sessionStorage]) {
    try {
      const session = JSON.parse(store.getItem('helpdesk_session') || 'null');
      if (session?.token) {
        if (!isTokenExpired(session.token)) return session;
        store.removeItem('helpdesk_session');
      }
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
