import React, { useState, useEffect, useRef } from 'react';
import { Menu, Bell, QrCode, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Navbar({ onOpenSidebar, onOpenScanner, onNewRequest, currentView }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unread_count);
        } catch (e) {
            // ignore
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        } catch (e) {}
    };

    const markAllRead = async () => {
        try {
            await api.post('/notifications/read-all');
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) {}
    };

    const viewTitles = {
        dashboard: 'Main Dashboard',
        inventory: 'Equipment Inventory',
        requests: 'Gear Requests & Reservations',
        checkouts: 'Active Deployments & Handover',
        returns: 'Check-In & Return Inspections',
        maintenance: 'Equipment Maintenance & Service',
        incidents: 'Damage & Loss Incident Log',
        kits: 'Production Gear Kits',
        reports: 'Reports & Analytics',
        users: 'User & Access Management',
        categories: 'Equipment Categories',
        locations: 'Facility Locations',
        'audit-logs': 'Immutable Audit Trail',
        settings: 'Branding & Configuration',
        profile: 'User Profile Settings',
    };

    return (
        <header className="h-18 bg-[#162224]/95 backdrop-blur-md border-b border-[#2D4044] sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
            {/* Left Section: Mobile toggle & Title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onOpenSidebar}
                    className="p-2 text-[#CADEDF] hover:text-[#FFEBCC] rounded-xl hover:bg-[#1D2729] lg:hidden transition"
                >
                    <Menu size={22} />
                </button>
                <div>
                    <h1 className="text-base sm:text-lg font-extrabold text-white tracking-wide font-sans">
                        {viewTitles[currentView] || 'MTC GEAR'}
                    </h1>
                    <div className="text-[11px] text-[#CADEDF]/75 font-medium hidden sm:block font-sans">
                        Mountain Top Communications Production Ops
                    </div>
                </div>
            </div>

            {/* Right Section: Actions, Scanner, Notifications */}
            <div className="flex items-center gap-2.5 sm:gap-3">
                {/* QR Scanner Trigger */}
                <button
                    onClick={onOpenScanner}
                    title="Scan Asset QR Code"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#1D2729] border border-[#2D4044] text-[#CADEDF] hover:text-[#FFEBCC] hover:border-[#386642] text-xs font-semibold shadow-sm transition"
                >
                    <QrCode size={16} className="text-[#CADEDF]" />
                    <span className="hidden sm:inline">Scan QR</span>
                </button>

                {/* Quick Request Button */}
                {user?.role !== 'viewer' && (
                    <button
                        onClick={onNewRequest}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] text-xs font-bold shadow-md shadow-[#386642]/20 transition"
                    >
                        <Plus size={16} className="stroke-[3]" />
                        <span>Request Gear</span>
                    </button>
                )}

                {/* Notification Bell with Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-[#CADEDF] hover:text-[#FFEBCC] hover:bg-[#1D2729] rounded-xl transition"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#386642] text-[#FFEBCC] border border-[#162224] font-black text-[10px] rounded-full flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-2xl overflow-hidden z-50 text-[#CADEDF]">
                            <div className="p-3.5 border-b border-[#2D4044] bg-[#162224] flex items-center justify-between">
                                <div className="font-bold text-xs uppercase tracking-wider text-[#FFEBCC] flex items-center gap-2">
                                    <Bell size={14} className="text-[#386642]" />
                                    Notifications ({unreadCount} new)
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-[11px] text-[#FFEBCC] hover:underline font-medium"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="max-h-80 overflow-y-auto divide-y divide-[#2D4044]">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-[#829FA1]">
                                        No recent notifications.
                                    </div>
                                ) : (
                                    notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => markAsRead(n.id)}
                                            className={`p-3.5 transition hover:bg-[#243336] cursor-pointer ${
                                                !n.is_read ? 'bg-[#386642]/10' : ''
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="text-xs font-bold text-[#FFEBCC]">
                                                    {n.title}
                                                </div>
                                                {!n.is_read && (
                                                    <span className="w-2 h-2 rounded-full bg-[#386642] shrink-0 mt-1"></span>
                                                )}
                                            </div>
                                            <div className="text-xs text-[#CADEDF]/90 leading-relaxed">
                                                {n.message}
                                            </div>
                                            <div className="text-[10px] text-[#829FA1] mt-1 font-mono">
                                                {new Date(n.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
