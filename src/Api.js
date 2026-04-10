import axios from "axios";

const api = axios.create({
  baseURL: "https://meeo.opol.site/api",
// baseURL: "http://127.0.0.1:8000/api",

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor for handling 401 Unauthorized responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove auth token from localStorage
      localStorage.removeItem("authToken");
      
      // Set logout flag for cross-tab synchronization
      localStorage.setItem("logout", Date.now().toString());
      
      // Prevent infinite redirect loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;