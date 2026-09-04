import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MtcIcon } from '../components/MtcLogo';
import { AfrihausPattern } from '../components/AfrihausPattern';

export default function LoginView() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials. Please verify and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (demoEmail, demoPass = 'Password123!') => {
        setEmail(demoEmail);
        setPassword(demoPass);
    };

    return (
        <div className="min-h-screen bg-[#121A1C] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans selection:bg-[#386642] selection:text-[#FFEBCC]">
            {/* Ambient background glows with MTC Hunter Green and Cornsilk */}
            <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#386642]/15 blur-[140px] pointer-events-none"></div>
            <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#FFEBCC]/5 blur-[140px] pointer-events-none"></div>

            {/* Subtle decorative Afrihaus side borders on large screens */}
            <div className="hidden 2xl:block absolute left-8 top-1/2 -translate-y-1/2 h-[600px] opacity-20 pointer-events-none">
                <AfrihausPattern orientation="vertical" />
            </div>
            <div className="hidden 2xl:block absolute right-8 top-1/2 -translate-y-1/2 h-[600px] opacity-20 pointer-events-none">
                <AfrihausPattern orientation="vertical" />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Official Brand Header */}
                <div className="text-center mb-7">
                    <div className="inline-flex items-center justify-center mb-3">
                        <MtcIcon size={72} bg="#386642" peakColor="#FFEBCC" rounded="rounded-2xl" className="shadow-xl shadow-[#386642]/25" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider font-sans">
                        MTC <span className="text-[#FFEBCC]">GEAR</span>
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-[#FFEBCC] mt-1 uppercase tracking-widest font-sans">
                        Mountain Top Communications
                    </p>
                    <p className="text-xs text-[#CADEDF]/75 mt-0.5">
                        Equipment Inventory & Deployment Management
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-[#1D2729] border border-[#2D4044] rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-lg font-bold text-white font-sans">Authorized Access</h2>
                        <span className="text-[10px] font-mono uppercase bg-[#386642]/30 text-[#FFEBCC] px-2 py-0.5 rounded border border-[#386642]/60 font-semibold">
                            Internal System
                        </span>
                    </div>
                    <p className="text-xs text-[#CADEDF]/80 mb-5 leading-relaxed">
                        Sign in with your authorized MTC credentials to manage or reserve production equipment.
                    </p>

                    {error && (
                        <div className="mb-5 p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#CADEDF] uppercase tracking-wider mb-1.5 font-sans">
                                Work Email
                            </label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829FA1]" />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@mtc.local"
                                    className="w-full bg-[#162224] border border-[#2D4044] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#829FA1] focus:outline-none focus:border-[#386642] focus:ring-1 focus:ring-[#386642] transition"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#CADEDF] uppercase tracking-wider mb-1.5 font-sans">
                                Password
                            </label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#829FA1]" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#162224] border border-[#2D4044] rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-[#829FA1] focus:outline-none focus:border-[#386642] focus:ring-1 focus:ring-[#386642] transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#829FA1] hover:text-[#FFEBCC]"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-[#386642] hover:bg-[#2E5437] text-[#FFEBCC] font-bold py-3 px-4 rounded-xl shadow-lg shadow-[#386642]/25 transition duration-200 mt-2 disabled:opacity-50 text-sm font-sans"
                        >
                            {loading ? (
                                <span>Authenticating...</span>
                            ) : (
                                <>
                                    <span>Sign In to MTC Gear</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Quick Demo Switcher */}
                    <div className="mt-7 pt-5 border-t border-[#2D4044]">
                        <div className="text-[11px] font-bold text-[#FFEBCC] uppercase tracking-wider text-center mb-3 flex items-center justify-center gap-1.5 font-sans">
                            <Sparkles size={13} className="text-[#386642]" />
                            <span>One-Click Demo Accounts</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => handleQuickLogin('admin@mtc.local')}
                                className="p-2.5 rounded-xl bg-[#162224] border border-[#2D4044] hover:border-[#386642] text-left transition group"
                            >
                                <div className="text-xs font-bold text-[#FFEBCC] group-hover:text-white font-sans">
                                    Super Admin
                                </div>
                                <div className="text-[10px] text-[#829FA1] font-mono">admin@mtc.local</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickLogin('overseer@mtc.local')}
                                className="p-2.5 rounded-xl bg-[#162224] border border-[#2D4044] hover:border-[#386642] text-left transition group"
                            >
                                <div className="text-xs font-bold text-[#CADEDF] group-hover:text-white font-sans">
                                    Gear Overseer
                                </div>
                                <div className="text-[10px] text-[#829FA1] font-mono">overseer@mtc.local</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickLogin('staff@mtc.local')}
                                className="p-2.5 rounded-xl bg-[#162224] border border-[#2D4044] hover:border-[#386642] text-left transition group"
                            >
                                <div className="text-xs font-bold text-[#A7F3D0] group-hover:text-white font-sans">
                                    Staff / Crew
                                </div>
                                <div className="text-[10px] text-[#829FA1] font-mono">staff@mtc.local</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => handleQuickLogin('viewer@mtc.local')}
                                className="p-2.5 rounded-xl bg-[#162224] border border-[#2D4044] hover:border-[#386642] text-left transition group"
                            >
                                <div className="text-xs font-bold text-[#829FA1] group-hover:text-white font-sans">
                                    Viewer (Read)
                                </div>
                                <div className="text-[10px] text-[#829FA1] font-mono">viewer@mtc.local</div>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-[#829FA1] mt-6 font-sans">
                    © {new Date().getFullYear()} Mountain Top Communications. All rights reserved.
                </div>
            </div>
        </div>
    );
}
