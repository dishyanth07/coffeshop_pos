import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://coffeshop-pos-backend.onrender.com",
    timeout: 60000,
});

// Attach token automatically
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle 401 globally (except login)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest =
            error.config &&
            error.config.url &&
            error.config.url.includes("/auth/token");

        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem("token");

            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;