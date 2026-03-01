import axios from 'axios';

// FORCED HARDCODE: Ensure correct backend is hit regardless of Vercel env settings
const BASE_URL = 'https://mern-notification-engine.onrender.com';

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;
