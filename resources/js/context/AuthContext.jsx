import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('mtc_gear_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('mtc_gear_token'));
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState([]);

    const showToast = (message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    useEffect(() => {
        if (token) {
            api.get('/me')
                .then((res) => {
                    setUser(res.data.user);
                    localStorage.setItem('mtc_gear_user', JSON.stringify(res.data.user));
                })
                .catch(() => {
                    setUser(null);
                    setToken(null);
                    localStorage.removeItem('mtc_gear_token');
                    localStorage.removeItem('mtc_gear_user');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [token]);

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { token: newToken, user: userData } = res.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('mtc_gear_token', newToken);
        localStorage.setItem('mtc_gear_user', JSON.stringify(userData));
        showToast(`Welcome back, ${userData.name}!`, 'success');
        return userData;
    };

    const logout = async () => {
        try {
            await api.post('/logout');
        } catch (e) {
            // ignore
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem('mtc_gear_token');
            localStorage.removeItem('mtc_gear_user');
            showToast('Logged out successfully.', 'info');
        }
    };

    const refreshUser = async () => {
        if (!token) return;
        const res = await api.get('/me');
        setUser(res.data.user);
        localStorage.setItem('mtc_gear_user', JSON.stringify(res.data.user));
    };

    const isSuperAdmin = user?.role === 'super_admin';
    const isOverseer = user?.role === 'gear_overseer';
    const isStaff = user?.role === 'staff';
    const isViewer = user?.role === 'viewer';
    const canManageEquipment = isSuperAdmin || isOverseer;

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                logout,
                refreshUser,
                showToast,
                isSuperAdmin,
                isOverseer,
                isStaff,
                isViewer,
                canManageEquipment,
            }}
        >
            {children}
            {/* Floating Toast Notification Container */}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 font-sans ${
                            t.type === 'success'
                                ? 'bg-[#1D2729] border-[#386642] text-[#FFEBCC]'
                                : t.type === 'error'
                                ? 'bg-red-950/95 border-red-500/50 text-red-200'
                                : t.type === 'warning'
                                ? 'bg-[#1D2729] border-[#FFEBCC]/50 text-[#FFEBCC]'
                                : 'bg-[#1D2729] border-[#2D4044] text-[#CADEDF]'
                        }`}
                    >
                        <div className="text-sm font-medium pr-2">{t.message}</div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="text-xs opacity-70 hover:opacity-100 p-1 font-bold"
                        >
                            ✕
                        </button>
                    </div>
                ))}
            </div>
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
