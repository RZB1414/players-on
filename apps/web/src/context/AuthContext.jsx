import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_REFRESH_INTERVAL = 13 * 60 * 1000; // 13 minutes (before 15min expiry)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [suspiciousLogin, setSuspiciousLogin] = useState(null);
    const refreshTimerRef = useRef(null);

    const startRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
        }

        refreshTimerRef.current = setInterval(async () => {
            try {
                await api.post('/api/auth/refresh');
            } catch {
                // If refresh fails, user needs to re-login
                setUser(null);
                setSuspiciousLogin(null);
            }
        }, TOKEN_REFRESH_INTERVAL);
    }, []);

    const stopRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }
    }, []);

    const checkAuth = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await api.get('/api/auth/me');
            setUser(data.user);
            startRefreshTimer();
        } catch {
            setUser(null);
            stopRefreshTimer();
        } finally {
            setIsLoading(false);
        }
    }, [startRefreshTimer, stopRefreshTimer]);

    useEffect(() => {
        checkAuth();
        return () => stopRefreshTimer();
    }, [checkAuth, stopRefreshTimer]);

    const loginUser = async (email, password) => {
        const data = await api.post('/api/auth/login', { email, password });
        setUser(data.user);

        if (data.suspiciousLogin?.isSuspicious) {
            setSuspiciousLogin(data.suspiciousLogin);
        } else {
            setSuspiciousLogin(null);
        }

        startRefreshTimer();
        return data;
    };

    const registerUser = async (name, email, password) => {
        const data = await api.post('/api/auth/register', { name, email, password });
        return data;
    };

    const logoutUser = async () => {
        try {
            await api.post('/api/auth/logout');
        } catch {
            // Logout should always succeed on the client side
        }
        setUser(null);
        setSuspiciousLogin(null);
        stopRefreshTimer();
    };

    const getSessions = async () => {
        const data = await api.get('/api/auth/sessions');
        return data.sessions;
    };

    const revokeSession = async (sessionId) => {
        await api.delete(`/api/auth/sessions/${sessionId}`);
    };

    const getAuditLog = async (limit = 20, skip = 0) => {
        const data = await api.get(`/api/auth/audit?limit=${limit}&skip=${skip}`);
        return data.logs;
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        suspiciousLogin,
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
        checkAuth,
        getSessions,
        revokeSession,
        getAuditLog,
        dismissSuspiciousLogin: () => setSuspiciousLogin(null),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
