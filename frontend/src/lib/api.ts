// Production Sync: Force redeploy v2.0.2 to clear cached API URLs
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mern-notification-engine.onrender.com';

const api = axios.create({
    baseURL: BASE_URL,
});

export default api;
