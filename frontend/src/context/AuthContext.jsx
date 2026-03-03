import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const decodeToken = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Token decoding failed:", e);
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = decodeToken(token);
            if (payload) {
                return {
                    id: payload.id,
                    username: payload.sub,
                    role: payload.role,
                    branch_id: payload.branch_id,
                    require_password_change: payload.require_password_change
                };
            }
            localStorage.removeItem('token');
        }
        return null;
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initial load is already handled by useState initializer
    }, []);

    const login = async (username, password) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token } = response.data;
        localStorage.setItem('token', access_token);

        // Decode token to set user state immediately
        const payload = decodeToken(access_token);
        if (payload) {
            setUser({
                id: payload.id,
                username: payload.sub,
                role: payload.role,
                branch_id: payload.branch_id,
                require_password_change: payload.require_password_change
            });
        }

        return true;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
