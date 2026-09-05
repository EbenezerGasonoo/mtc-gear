import React, { useEffect, useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    AlertTriangle,
    Layers,
    Clock,
    User,
    MapPin,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    Info,
    RefreshCw
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/Badge';
import Modal from '../components/Modal';

export default function CalendarView({ onNavigateTo }) {
    const { showToast } = useAuth();

    // Timeline range state
    const [viewMode, setViewMode] = useState('2weeks'); // 'week', '2weeks', 'month'
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filters & Search
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Data state
    const [loading, setLoading] = useState(true);
    const [timelineData, setTimelineData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({
        total_assets: 0,
        active_deployments: 0,
        upcoming_bookings: 0,
        detected_conflicts: 0
    });
    const [conflictsList, setConflictsList] = useState([]);
    const [showConflictPanel, setShowConflictPanel] = useState(false);

    // Selected booking for detailed modal
    const [selectedBooking, setSelectedBooking] = useState(null);

    // Calculate dates based on viewMode and currentDate
    const dateRange = useMemo(() => {
        const start = new Date(currentDate);
        let days = 14;

        if (viewMode === 'week') {
            days = 7;
            start.setDate(start.getDate() - start.getDay() + 1); // Start Monday
        } else if (viewMode === '2weeks') {
            days = 14;
            start.setDate(start.getDate() - start.getDay() + 1); // Start Monday
        } else if (viewMode === 'month') {
            days = 31;
            start.setDate(1); // Start 1st of month
        }

        start.setHours(0, 0, 0, 0);

        const dayList = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            dayList.push(d);
        }

        const end = new Date(dayList[dayList.length - 1]);
        end.setHours(23, 59, 59, 999);

        return {
            start,
            end,
            days: dayList,
            startStr: start.toISOString().split('T')[0],
            endStr: end.toISOString().split('T')[0]
        };
    }, [currentDate, viewMode]);

    // Fetch Timeline data from API
    const fetchTimeline = async () => {
        setLoading(true);
        try {
            const params = {
                start_date: dateRange.startStr,
                end_date: dateRange.endStr,
            };
            if (selectedCategory !== 'all') params.category_id = selectedCategory;
            if (selectedStatus !== 'all') params.status = selectedStatus;
            if (searchQuery) params.search = searchQuery;

            const [timelineRes, conflictsRes] = await Promise.all([
                api.get('/calendar/timeline', { params }),
                api.get('/calendar/conflicts')
            ]);

            setTimelineData(timelineRes.data.timeline || []);
            setCategories(timelineRes.data.categories || []);
            setStats(timelineRes.data.stats || {
                total_assets: 0,
                active_deployments: 0,
                upcoming_bookings: 0,
                detected_conflicts: 0
            });
            setConflictsList(conflictsRes.data.conflicts || []);
        } catch (err) {
            showToast('Failed to load production calendar.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
    }, [dateRange.startStr, dateRange.endStr, selectedCategory, selectedStatus]);

    // Navigation helpers
    const handlePrev = () => {
        const next = new Date(currentDate);
        if (viewMode === 'week') next.setDate(next.getDate() - 7);
        else if (viewMode === '2weeks') next.setDate(next.getDate() - 14);
        else next.setMonth(next.getMonth() - 1);
        setCurrentDate(next);
    };

    const handleNext = () => {
        const next = new Date(currentDate);
        if (viewMode === 'week') next.setDate(next.getDate() + 7);
        else if (viewMode === '2weeks') next.setDate(next.getDate() + 14);
        else next.setMonth(next.getMonth() + 1);
        setCurrentDate(next);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // Filtered timeline rows based on client-side instant search
    const filteredRows = useMemo(() => {
        if (!searchQuery) return timelineData;
        const q = searchQuery.toLowerCase();
        return timelineData.filter(row =>
            row.name.toLowerCase().includes(q) ||
            (row.asset_id && row.asset_id.toLowerCase().includes(q)) ||
            (row.model && row.model.toLowerCase().includes(q)) ||
            row.bookings.some(b => b.project_name.toLowerCase().includes(q) || b.user_name.toLowerCase().includes(q))
        );
    }, [timelineData, searchQuery]);

    // Helper: calculate horizontal grid bar positioning
    const calculateBarPosition = (bStartStr, bEndStr) => {
        const bStart = new Date(bStartStr);
        const bEnd = new Date(bEndStr);
        bStart.setHours(0, 0, 0, 0);
        bEnd.setHours(23, 59, 59, 999);

        const totalDays = dateRange.days.length;
        const gridStart = dateRange.start;
        const gridEnd = dateRange.end;

        // Clamping within visible grid window
        const effectiveStart = bStart < gridStart ? gridStart : bStart;
        const effectiveEnd = bEnd > gridEnd ? gridEnd : bEnd;

        if (effectiveStart > gridEnd || effectiveEnd < gridStart) {
            return null; // Out of view
        }

        const msPerDay = 24 * 60 * 60 * 1000;
        const startDiffDays = Math.max(0, Math.floor((effectiveStart - gridStart) / msPerDay));
        const durationDays = Math.max(1, Math.ceil((effectiveEnd - effectiveStart) / msPerDay));

        const leftPercent = (startDiffDays / totalDays) * 100;
        const widthPercent = Math.min(100 - leftPercent, (durationDays / totalDays) * 100);

        return {
            left: `${leftPercent}%`,
            width: `${Math.max(widthPercent, 1.5)}%`
        };
    };

    // Format current period title
    const formattedPeriodTitle = useMemo(() => {
        const options = { month: 'short', year: 'numeric' };
        if (viewMode === 'month') {
            return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
        const sMonth = dateRange.days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const eMonth = dateRange.days[dateRange.days.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${sMonth} – ${eMonth}`;
    }, [currentDate, dateRange, viewMode]);

    const isToday = (d) => {
        const today = new Date();
        return d.getDate() === today.getDate() &&
               d.getMonth() === today.getMonth() &&
               d.getFullYear() === today.getFullYear();
    };

    const isWeekend = (d) => {
        const day = d.getDay();
        return day === 0 || day === 6; // Sun or Sat
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Header with Title and Mode Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 rounded-lg bg-[#386642]/20 border border-[#386642] text-[#FFEBCC]">
                            <CalendarIcon className="w-5 h-5" />
                        </span>
                        <h2 className="text-xl font-bold text-white tracking-wide">
                            Production Schedule & Gantt Timeline
                        </h2>
                    </div>
                    <p className="text-xs text-[#CADEDF] mt-1">
                        Visual equipment booking timeline with automated conflict and turnaround collision detection.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Mode Buttons */}
                    <div className="bg-[#162224] p-1 rounded-lg border border-[#2D4044] flex items-center">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                viewMode === 'week'
                                    ? 'bg-[#386642] text-[#FFEBCC] shadow-sm'
                                    : 'text-[#CADEDF] hover:text-white'
                            }`}
                        >
                            1 Week
                        </button>
                        <button
                            onClick={() => setViewMode('2weeks')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                viewMode === '2weeks'
                                    ? 'bg-[#386642] text-[#FFEBCC] shadow-sm'
                                    : 'text-[#CADEDF] hover:text-white'
                            }`}
                        >
                            2 Weeks
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                                viewMode === 'month'
                                    ? 'bg-[#386642] text-[#FFEBCC] shadow-sm'
                                    : 'text-[#CADEDF] hover:text-white'
                            }`}
                        >
                            Month
                        </button>
                    </div>

                    <button
                        onClick={fetchTimeline}
                        className="p-2 bg-[#1D2729] hover:bg-[#253335] text-[#CADEDF] border border-[#2D4044] rounded-lg transition-colors"
                        title="Refresh Timeline"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#FFEBCC]' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#CADEDF]">Tracked Gear</span>
                    <div className="text-xl font-bold text-white mt-0.5">{stats.total_assets}</div>
                </div>
                <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#CADEDF]">Active Deployments</span>
                    <div className="text-xl font-bold text-[#FFEBCC] mt-0.5">{stats.active_deployments}</div>
                </div>
                <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl p-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#CADEDF]">Upcoming Bookings</span>
                    <div className="text-xl font-bold text-white mt-0.5">{stats.upcoming_bookings}</div>
                </div>
                <div
                    onClick={() => setShowConflictPanel(!showConflictPanel)}
                    className={`border rounded-xl p-3 cursor-pointer transition-all ${
                        stats.detected_conflicts > 0
                            ? 'bg-red-950/30 border-red-500/50 hover:border-red-400'
                            : 'bg-[#1D2729] border-[#2D4044]'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#CADEDF]">Conflicts Detected</span>
                        {stats.detected_conflicts > 0 && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </div>
                    <div className={`text-xl font-bold mt-0.5 ${stats.detected_conflicts > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                        {stats.detected_conflicts} {stats.detected_conflicts === 0 ? '✓' : '⚠️'}
                    </div>
                </div>
            </div>

            {/* Conflicts Warning Dropdown Panel */}
            {conflictsList.length > 0 && showConflictPanel && (
                <div className="bg-red-950/40 border border-red-500/40 rounded-xl p-4 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-red-300 font-semibold text-sm">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span>Booking Overlap & Collision Warnings ({conflictsList.length})</span>
                        </div>
                        <button
                            onClick={() => setShowConflictPanel(false)}
                            className="text-xs text-red-300 hover:text-white"
                        >
                            Close
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {conflictsList.map((cnf, idx) => (
                            <div key={idx} className="bg-[#162224] border border-red-500/30 rounded-lg p-3 text-xs space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-white">Equipment Collision</span>
                                    <span className="text-red-400 bg-red-900/40 px-2 py-0.5 rounded text-[10px] font-mono">
                                        Overlap: {cnf.overlap_start} to {cnf.overlap_end}
                                    </span>
                                </div>
                                <div className="text-[#CADEDF]">
                                    <div className="font-medium text-amber-200">
                                        • Request #{cnf.request_1.id}: {cnf.request_1.project_name} ({cnf.request_1.user})
                                    </div>
                                    <div className="font-medium text-amber-200">
                                        • Request #{cnf.request_2.id}: {cnf.request_2.project_name} ({cnf.request_2.user})
                                    </div>
                                </div>
                                <div className="text-[11px] text-[#CADEDF]/80 pt-1 border-t border-red-500/20">
                                    Shared Items: {cnf.shared_equipment.map(e => e.name).join(', ')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation & Controls Bar */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                {/* Previous / Today / Next */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrev}
                        className="p-1.5 bg-[#162224] hover:bg-[#253335] text-[#CADEDF] border border-[#2D4044] rounded-lg transition-colors"
                        title="Previous Window"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleToday}
                        className="px-3 py-1.5 bg-[#162224] hover:bg-[#253335] text-xs font-semibold text-[#CADEDF] hover:text-white border border-[#2D4044] rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={handleNext}
                        className="p-1.5 bg-[#162224] hover:bg-[#253335] text-[#CADEDF] border border-[#2D4044] rounded-lg transition-colors"
                        title="Next Window"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-[#FFEBCC] ml-2 tracking-wide font-display">
                        {formattedPeriodTitle}
                    </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Category Filter */}
                    <div className="relative">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-[#162224] text-xs font-medium text-[#CADEDF] border border-[#2D4044] rounded-lg px-2.5 py-1.5 pr-8 focus:outline-none focus:border-[#386642]"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="bg-[#162224] text-xs font-medium text-[#CADEDF] border border-[#2D4044] rounded-lg px-2.5 py-1.5 pr-8 focus:outline-none focus:border-[#386642]"
                        >
                            <option value="all">All Statuses</option>
                            <option value="approved">Approved</option>
                            <option value="checked_out">Checked Out</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>

                    {/* Instant Search */}
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#CADEDF]" />
                        <input
                            type="text"
                            placeholder="Filter gear or project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#162224] text-xs text-white placeholder-[#CADEDF]/50 pl-8 pr-3 py-1.5 rounded-lg border border-[#2D4044] focus:outline-none focus:border-[#386642] w-40 sm:w-52"
                        />
                    </div>
                </div>
            </div>

            {/* Gantt Timeline View Table */}
            <div className="bg-[#1D2729] border border-[#2D4044] rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                        {/* Table Header: Days Grid */}
                        <div className="flex border-b border-[#2D4044] bg-[#162224]">
                            {/* Sticky Left Column Header: Equipment info */}
                            <div className="w-64 flex-shrink-0 p-3 text-xs font-bold uppercase tracking-wider text-[#CADEDF] border-r border-[#2D4044]">
                                Equipment / Serial
                            </div>

                            {/* Days Columns */}
                            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${dateRange.days.length}, minmax(0, 1fr))` }}>
                                {dateRange.days.map((day, idx) => {
                                    const today = isToday(day);
                                    const weekend = isWeekend(day);
                                    return (
                                        <div
                                            key={idx}
                                            className={`p-2 text-center border-r border-[#2D4044]/50 select-none ${
                                                today
                                                    ? 'bg-[#386642]/25 font-bold text-[#FFEBCC]'
                                                    : weekend
                                                    ? 'bg-[#121A1C]/50 text-[#CADEDF]/60'
                                                    : 'text-[#CADEDF]'
                                            }`}
                                        >
                                            <div className="text-[10px] uppercase font-semibold">
                                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div className={`text-xs mt-0.5 ${today ? 'text-[#FFEBCC] font-bold' : ''}`}>
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Timeline Rows */}
                        {loading ? (
                            <div className="p-12 text-center text-[#CADEDF]">
                                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FFEBCC]" />
                                <p className="text-sm">Rendering production schedule...</p>
                            </div>
                        ) : filteredRows.length === 0 ? (
                            <div className="p-12 text-center text-[#CADEDF]">
                                <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#FFEBCC]" />
                                <p className="text-sm font-medium">No equipment found matching criteria.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-[#2D4044]/50">
                                {filteredRows.map((row) => (
                                    <div key={row.id} className="flex hover:bg-[#253335]/30 transition-colors group">
                                        {/* Left Column: Asset Identity */}
                                        <div className="w-64 flex-shrink-0 p-3 border-r border-[#2D4044] flex flex-col justify-center">
                                            <div className="flex items-center gap-1.5">
                                                <span className="font-mono text-[10px] font-bold text-[#FFEBCC] bg-[#162224] px-1.5 py-0.5 rounded border border-[#2D4044]">
                                                    {row.asset_id || `ID-${row.id}`}
                                                </span>
                                                {row.has_active_conflict && (
                                                    <span className="text-red-400" title="Has scheduling conflict">
                                                        <AlertTriangle className="w-3.5 h-3.5 inline animate-pulse" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs font-semibold text-white truncate mt-1" title={row.name}>
                                                {row.name}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#CADEDF]">
                                                <span>{row.model || row.category_name}</span>
                                                <span>&bull;</span>
                                                <span className="capitalize">{row.status}</span>
                                            </div>
                                        </div>

                                        {/* Right Column: Timeline Gantt Grid with Booking Bars */}
                                        <div className="flex-1 relative min-h-[58px] flex items-center">
                                            {/* Vertical Day Grid Background Lines */}
                                            <div
                                                className="absolute inset-0 grid pointer-events-none"
                                                style={{ gridTemplateColumns: `repeat(${dateRange.days.length}, minmax(0, 1fr))` }}
                                            >
                                                {dateRange.days.map((day, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`border-r border-[#2D4044]/25 h-full ${
                                                            isToday(day) ? 'bg-[#386642]/10' : isWeekend(day) ? 'bg-[#121A1C]/30' : ''
                                                        }`}
                                                    ></div>
                                                ))}
                                            </div>

                                            {/* Booking Bars */}
                                            {row.bookings.map((booking) => {
                                                const pos = calculateBarPosition(booking.start_date, booking.end_date);
                                                if (!pos) return null;

                                                const isConflict = booking.has_conflict;
                                                const isTight = booking.is_tight_turnaround;
                                                const isCheckedOut = booking.status.toUpperCase() === 'CHECKED_OUT';
                                                const isApproved = booking.status.toUpperCase() === 'APPROVED';
                                                const isOverdue = booking.status.toUpperCase() === 'OVERDUE';

                                                let barColorClass = 'bg-[#386642] text-[#FFEBCC] border-[#4a8257]'; // Default Approved
                                                if (isCheckedOut) {
                                                    barColorClass = 'bg-[#1D2729] text-[#CADEDF] border-[#386642] border-2';
                                                } else if (isOverdue) {
                                                    barColorClass = 'bg-red-700 text-white border-red-500';
                                                } else if (isConflict) {
                                                    barColorClass = 'bg-red-800 text-white border-red-400 animate-pulse';
                                                } else if (!isApproved) {
                                                    barColorClass = 'bg-[#253335] text-[#FFEBCC] border-[#FFEBCC]/40'; // Pending
                                                }

                                                return (
                                                    <button
                                                        key={booking.id}
                                                        onClick={() => setSelectedBooking({ ...booking, asset: row })}
                                                        style={{ left: pos.left, width: pos.width }}
                                                        className={`absolute top-2 bottom-2 rounded-md px-2 text-left text-[11px] font-medium shadow-md transition-all hover:scale-[1.01] hover:brightness-110 z-10 flex items-center justify-between border overflow-hidden ${barColorClass}`}
                                                    >
                                                        <span className="truncate font-semibold tracking-tight">
                                                            {booking.project_name} &bull; <span className="opacity-80 text-[10px]">{booking.user_name}</span>
                                                        </span>
                                                        {isConflict && (
                                                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-300 ml-1" />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-[#CADEDF] bg-[#1D2729] p-3 rounded-xl border border-[#2D4044]">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-semibold text-white">Timeline Legend:</span>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-[#386642] border border-[#4a8257]"></span>
                        <span>Approved Booking</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-[#1D2729] border-2 border-[#386642]"></span>
                        <span>Checked Out in Field</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-[#253335] border border-[#FFEBCC]/40"></span>
                        <span>Pending Request</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded bg-red-800 border border-red-400"></span>
                        <span>Conflict / Overlap</span>
                    </div>
                </div>
                <div className="text-[11px] text-[#CADEDF]/70">
                    Click any booking bar to inspect reservation details.
                </div>
            </div>

            {/* Detailed Booking Drawer / Modal */}
            {selectedBooking && (
                <Modal
                    isOpen={!!selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    title={`Booking Inspection & Custody: ${selectedBooking.project_name}`}
                >
                    <div className="space-y-4 text-sm text-[#CADEDF]">
                        {/* Conflict Alert Banner inside Modal */}
                        {selectedBooking.has_conflict && (
                            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-lg text-xs text-red-300 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold text-red-200">Scheduling Clash Detected</div>
                                    <div>{selectedBooking.conflict_reason}</div>
                                </div>
                            </div>
                        )}

                        {selectedBooking.is_tight_turnaround && !selectedBooking.has_conflict && (
                            <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-xs text-amber-200 flex items-start gap-2">
                                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <div className="font-bold">Tight Turnaround Warning</div>
                                    <div>{selectedBooking.conflict_reason}</div>
                                </div>
                            </div>
                        )}

                        {/* Key Info Grid */}
                        <div className="bg-[#162224] p-4 rounded-xl border border-[#2D4044] space-y-3">
                            <div className="flex justify-between items-center pb-2 border-b border-[#2D4044]">
                                <span className="text-xs text-[#CADEDF] uppercase font-semibold">Equipment</span>
                                <span className="font-bold text-white font-mono">{selectedBooking.asset.asset_id} &bull; {selectedBooking.asset.name}</span>
                            </div>

                            <div className="flex justify-between items-center pb-2 border-b border-[#2D4044]">
                                <span className="text-xs text-[#CADEDF] uppercase font-semibold">Borrower / Requester</span>
                                <span className="font-medium text-white flex items-center gap-1.5">
                                    <User className="w-3.5 h-3.5 text-[#FFEBCC]" />
                                    {selectedBooking.user_name} ({selectedBooking.user_email})
                                </span>
                            </div>

                            <div className="flex justify-between items-center pb-2 border-b border-[#2D4044]">
                                <span className="text-xs text-[#CADEDF] uppercase font-semibold">Deployment Window</span>
                                <span className="font-medium text-[#FFEBCC]">
                                    {selectedBooking.start_date} &rarr; {selectedBooking.end_date}
                                </span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-xs text-[#CADEDF] uppercase font-semibold">Booking Status</span>
                                <StatusBadge status={selectedBooking.status} />
                            </div>
                        </div>

                        {selectedBooking.notes && (
                            <div className="text-xs bg-[#162224] p-3 rounded-lg border border-[#2D4044]">
                                <span className="font-semibold text-white">Project Notes:</span> {selectedBooking.notes}
                            </div>
                        )}

                        {/* Quick Action Navigation */}
                        <div className="flex justify-end gap-2 pt-2">
                            {selectedBooking.type === 'request' && onNavigateTo && (
                                <button
                                    onClick={() => {
                                        setSelectedBooking(null);
                                        onNavigateTo('requests');
                                    }}
                                    className="px-4 py-2 bg-[#386642] text-[#FFEBCC] rounded-lg text-xs font-semibold hover:bg-[#4a8257] flex items-center gap-1.5 transition-colors"
                                >
                                    <span>Go to Request #{selectedBooking.record_id}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {selectedBooking.type === 'checkout' && onNavigateTo && (
                                <button
                                    onClick={() => {
                                        setSelectedBooking(null);
                                        onNavigateTo('checkouts');
                                    }}
                                    className="px-4 py-2 bg-[#386642] text-[#FFEBCC] rounded-lg text-xs font-semibold hover:bg-[#4a8257] flex items-center gap-1.5 transition-colors"
                                >
                                    <span>Go to Checkout #{selectedBooking.record_id}</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                            )}

                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="px-4 py-2 bg-[#162224] text-[#CADEDF] border border-[#2D4044] rounded-lg text-xs font-semibold hover:bg-[#253335]"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
