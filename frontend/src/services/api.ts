import axios from "axios";

let rawUrl = import.meta.env.VITE_API_URL || "/api/v1";
if (rawUrl && !rawUrl.startsWith("http") && !rawUrl.startsWith("/")) {
  rawUrl = `https://${rawUrl}`;
}
if (rawUrl.startsWith("http") && !rawUrl.endsWith("/api/v1")) {
  rawUrl = `${rawUrl.replace(/\/$/, "")}/api/v1`;
}
const API_URL = rawUrl;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Load token helper
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

// Request Interceptor: Attach access token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 Unauthorized and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/login")) {
      originalRequest._retry = true;
      const refresh = getRefreshToken();
      
      if (refresh) {
        try {
          // Attempt refreshing access token
          const res = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refresh
          });
          
          const { access_token, refresh_token } = res.data;
          
          localStorage.setItem("accessToken", access_token);
          localStorage.setItem("refreshToken", refresh_token);
          
          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, purge tokens and redirect
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login?expired=true";
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);
