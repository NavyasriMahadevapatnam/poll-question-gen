import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

//Use if backend require AUTHORIZATION for endpoints
/*
import { getAuth } from "firebase/auth";
api.interceptors.request.use(
    async (config) => {
        const user = getAuth().currentUser;
        if (user) {
            const token = await user.getIdToken();
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
*/

// Response interceptor for rate limiting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryMessage = retryAfter
        ? `Please wait ${retryAfter} seconds before trying again.`
        : 'Please wait a moment before trying again.';

      const errorMessage = error.response.data?.error || 'Too many requests';

      toast.error(`Rate limit exceeded`, {
        description: `${errorMessage}. ${retryMessage}`,
        duration: 5000,
      });
    }
    return Promise.reject(error);
  },
);

export default api;
