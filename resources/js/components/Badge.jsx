import React from 'react';

export function StatusBadge({ status }) {
    const s = (status || '').toLowerCase();

    const config = {
        available: {
            label: 'AVAILABLE',
            bg: 'bg-[#386642]/20 text-[#A7F3D0] border-[#386642]/50',
            dot: 'bg-[#386642]',
        },
        reserved: {
            label: 'RESERVED',
            bg: 'bg-[#FFEBCC]/10 text-[#FFEBCC] border-[#FFEBCC]/30',
            dot: 'bg-[#FFEBCC]',
        },
        checked_out: {
            label: 'CHECKED OUT',
            bg: 'bg-[#1D2729] text-[#CADEDF] border-[#2D4044]',
            dot: 'bg-[#CADEDF]',
        },
        maintenance: {
            label: 'MAINTENANCE',
            bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
            dot: 'bg-amber-400',
        },
        damaged: {
            label: 'DAMAGED',
            bg: 'bg-red-500/15 text-red-300 border-red-500/40',
            dot: 'bg-red-400 animate-pulse',
        },
        lost: {
            label: 'LOST',
            bg: 'bg-rose-950 text-rose-300 border-rose-800',
            dot: 'bg-rose-400',
        },
        retired: {
            label: 'RETIRED',
            bg: 'bg-[#162224] text-[#829FA1] border-[#2D4044]',
            dot: 'bg-[#829FA1]',
        },
        pending: {
            label: 'PENDING REVIEW',
            bg: 'bg-[#FFEBCC]/10 text-[#FFEBCC] border-[#FFEBCC]/30',
            dot: 'bg-[#FFEBCC] animate-pulse',
        },
        approved: {
            label: 'APPROVED',
            bg: 'bg-[#386642]/25 text-[#FFEBCC] border-[#386642]/60',
            dot: 'bg-[#386642]',
        },
        partially_approved: {
            label: 'PARTIALLY APPROVED',
            bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
            dot: 'bg-teal-400',
        },
        rejected: {
            label: 'REJECTED',
            bg: 'bg-red-500/15 text-red-300 border-red-500/30',
            dot: 'bg-red-400',
        },
        under_review: {
            label: 'CHANGES REQUESTED',
            bg: 'bg-[#FFEBCC]/15 text-[#FFEBCC] border-[#FFEBCC]/40',
            dot: 'bg-[#FFEBCC]',
        },
        overdue: {
            label: 'OVERDUE',
            bg: 'bg-red-600/20 text-red-300 border-red-500/60',
            dot: 'bg-red-500 animate-ping',
        },
        returned: {
            label: 'RETURNED',
            bg: 'bg-[#1D2729] text-[#CADEDF] border-[#2D4044]',
            dot: 'bg-[#CADEDF]',
        },
        completed: {
            label: 'COMPLETED',
            bg: 'bg-[#386642]/25 text-[#FFEBCC] border-[#386642]/60',
            dot: 'bg-[#386642]',
        },
        cancelled: {
            label: 'CANCELLED',
            bg: 'bg-[#162224] text-[#829FA1] border-[#2D4044]',
            dot: 'bg-[#829FA1]',
        },
    };

    const current = config[s] || {
        label: (status || 'UNKNOWN').toUpperCase(),
        bg: 'bg-[#1D2729] text-[#CADEDF] border-[#2D4044]',
        dot: 'bg-[#CADEDF]',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wider border font-mono ${current.bg}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
            {current.label}
        </span>
    );
}

export function ConditionBadge({ condition }) {
    const c = (condition || '').toLowerCase();

    const config = {
        excellent: 'text-[#A7F3D0] bg-[#386642]/20 border-[#386642]/40',
        good: 'text-[#CADEDF] bg-[#1D2729] border-[#2D4044]',
        fair: 'text-[#FFEBCC] bg-[#FFEBCC]/10 border-[#FFEBCC]/30',
        minor_damage: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
        damaged: 'text-red-400 bg-red-500/10 border-red-500/20',
    };

    const cls = config[c] || 'text-[#829FA1] bg-[#162224] border-[#2D4044]';

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${cls}`}>
            {condition?.replace('_', ' ') || 'Unknown'}
        </span>
    );
}

export function RoleBadge({ role }) {
    const config = {
        super_admin: { label: 'Super Admin', cls: 'bg-[#386642]/30 text-[#FFEBCC] border-[#386642]/70' },
        gear_overseer: { label: 'Gear Overseer', cls: 'bg-[#1D2729] text-[#CADEDF] border-[#2D4044]' },
        staff: { label: 'Staff / Crew', cls: 'bg-[#27482E]/30 text-[#CADEDF] border-[#386642]/40' },
        viewer: { label: 'Viewer', cls: 'bg-[#162224] text-[#829FA1] border-[#2D4044]' },
    };

    const cur = config[role] || { label: role, cls: 'bg-[#162224] text-[#829FA1] border-[#2D4044]' };

    return (
        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide border uppercase font-mono ${cur.cls}`}>
            {cur.label}
        </span>
    );
}
