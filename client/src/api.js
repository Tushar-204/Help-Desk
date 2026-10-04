import axios from 'axios';

// Vite proxies /api to the Express server (see vite.config.js)
const api = axios.create({ baseURL: '/api' });

export default api;
