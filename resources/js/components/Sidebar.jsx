import React from 'react';
import {
    LayoutDashboard,
    Boxes,
    FileSpreadsheet,
    ArrowUpRight,
    ArrowDownLeft,
    Wrench,
    AlertTriangle,
    Package,
    BarChart3,
    Users,
    Tag,
    MapPin,
    History,
    Settings,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './Badge';
import { MtcIcon } from './MtcLogo';

export default function Sidebar({ currentView, setCurrentView, isOpen, onClose }) {
    const { user, logout, isSuperAdmin, canManageEquipment } = useAuth();

    const mainNav = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Inventory', icon: Boxes },
        { id: 'requests', label: 'Requests', icon: FileSpreadsheet },
        { id: 'checkouts', label: 'Checkouts', icon: ArrowUpRight },
        { id: 'returns', label: 'Returns', icon: ArrowDownLeft },
        { id: 'maintenance', label: 'Maintenance', icon: Wrench },
        { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
        { id: 'kits', label: 'Gear Kits', icon: Package },
        { id: 'reports', label: 'Reports', icon: BarChart3 },
    ];

    const adminNav = [
        ...(isSuperAdmin ? [{ id: 'users', label: 'Users', icon: Users }] : []),
        ...(canManageEquipment ? [{ id: 'categories', label: 'Categories', icon: Tag }] : []),
        ...(canManageEquipment ? [{ id: 'locations', label: 'Locations', icon: MapPin }] : []),
        ...(isSuperAdmin ? [{ id: 'audit-logs', label: 'Audit Logs', icon: History }] : []),
        ...(isSuperAdmin ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
    ];

    const handleNav = (id) => {
        setCurrentView(id);
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
                    onClick={onClose}
                ></div>
            )}

            <aside
                className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#162224] border-r border-[#2D4044] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                {/* Brand Header with Official MTC Logo */}
                <div className="h-18 px-5 flex items-center gap-3 border-b border-[#2D4044] bg-[#121A1C]/80">
                    <MtcIcon size={38} bg="#386642" peakColor="#FFEBCC" />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-white text-base tracking-wider font-sans">
                                MTC <span className="text-[#FFEBCC]">GEAR</span>
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#386642] animate-pulse"></span>
                        </div>
                        <div className="text-[10px] font-semibold text-[#FFEBCC]/90 tracking-wide uppercase truncate max-w-[150px] font-sans">
                            Mountain Top Comm.
                        </div>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
                    {/* Main Section */}
                    <div>
                        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#829FA1] mb-2 font-sans">
                            Operations
                        </div>
                        <nav className="space-y-1">
                            {mainNav.map((item) => {
                                const Icon = item.icon;
                                const active = currentView === item.id || currentView.startsWith(`${item.id}-`);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleNav(item.id)}
                                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                            active
                                                ? 'bg-[#386642]/25 text-[#FFEBCC] border border-[#386642]/60 shadow-sm font-semibold'
                                                : 'text-[#CADEDF]/75 hover:text-white hover:bg-[#1D2729]'
                                        }`}
                                    >
                                        <Icon size={18} className={active ? 'text-[#FFEBCC]' : 'text-[#829FA1]'} />
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Admin Section */}
                    {adminNav.length > 0 && (
                        <div>
                            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#829FA1] mb-2 font-sans">
                                Administration
                            </div>
                            <nav className="space-y-1">
                                {adminNav.map((item) => {
                                    const Icon = item.icon;
                                    const active = currentView === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleNav(item.id)}
                                            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                active
                                                    ? 'bg-[#386642]/25 text-[#FFEBCC] border border-[#386642]/60 shadow-sm font-semibold'
                                                    : 'text-[#CADEDF]/75 hover:text-white hover:bg-[#1D2729]'
                                            }`}
                                        >
                                            <Icon size={18} className={active ? 'text-[#FFEBCC]' : 'text-[#829FA1]'} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    )}
                </div>

                {/* Bottom User Profile Card & Logout */}
                <div className="p-3 border-t border-[#2D4044] bg-[#121A1C]/80">
                    <div className="p-2.5 rounded-xl bg-[#1D2729] border border-[#2D4044] flex items-center justify-between mb-1">
                        <div
                            onClick={() => handleNav('profile')}
                            className="flex items-center gap-2.5 overflow-hidden cursor-pointer flex-1 group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-[#162224] border border-[#2D4044] flex items-center justify-center text-[#FFEBCC] font-bold text-xs shrink-0 group-hover:border-[#386642] transition">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="overflow-hidden">
                                <div className="text-xs font-semibold text-white truncate group-hover:text-[#FFEBCC] transition">
                                    {user?.name}
                                </div>
                                <div className="mt-0.5">
                                    <RoleBadge role={user?.role} />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            title="Sign Out"
                            className="p-1.5 text-[#829FA1] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
