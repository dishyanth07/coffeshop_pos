import axios from 'axios';

const api = axios.create();

// Add a request interceptor to include the auth token and fix URL routing
api.interceptors.request.use(
    (config) => {
        // Ensure URL starts with /api if it doesn't already
        let url = config.url || '';
        if (!url.startsWith('http') && !url.startsWith('/api')) {
            // If it starts with /, prepend api. Otherwise prepend /api/
            url = url.startsWith('/') ? `/api${url}` : `/api/${url}`;
        }

        // Fix trailing slash issues for directory-style endpoints to avoid 401-causing redirects
        // If the URL is just /api/products or /api/orders, ensure it has a trailing slash
        const commonEndpoints = ['products', 'sales', 'inventory', 'customers', 'auth', 'branches', 'suppliers'];
        commonEndpoints.forEach(endpoint => {
            if (url.endsWith(`/api/${endpoint}`)) {
                url = `${url}/`;
            }
        });

        config.url = url;

        const token = localStorage.getItem('token');
        if (token) {
            // Modern Axios 1.x header assignment
            if (config.headers.set) {
                config.headers.set('Authorization', `Bearer ${token}`);
            } else {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config && error.config.url && (error.config.url.includes('auth/token') || error.config.url.includes('login'));

        if (error.response && error.response.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token');
            // Only redirect if not already on login page to avoid infinite loops
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
