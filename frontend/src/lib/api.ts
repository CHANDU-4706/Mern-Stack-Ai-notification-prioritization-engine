import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mern-notification-engine.onrender.com';

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;
