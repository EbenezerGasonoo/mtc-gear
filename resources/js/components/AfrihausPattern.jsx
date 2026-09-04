import React from 'react';

/**
 * Official MTC "Afrihaus Pattern" (Brand Guideline Page 23)
 * Inspired by Bauhaus geometric principles and African aesthetics.
 * Uses Hunter Green (#386642), Cornsilk (#FFEBCC), Oxford Blue (#1D2729), and Platinum (#CADEDF).
 */
export function AfrihausPattern({ orientation = 'vertical', className = '' }) {
    if (orientation === 'horizontal') {
        return (
            <svg 
                className={`w-full overflow-hidden ${className}`} 
                viewBox="0 0 800 60" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
            >
                <rect width="800" height="60" fill="#1D2729" />
                {/* Sawtooth border top */}
                {[...Array(20)].map((_, i) => (
                    <polygon key={`t-${i}`} points={`${i * 40},0 ${i * 40 + 20},10 ${i * 40 + 40},0`} fill="#CADEDF" />
                ))}

                {/* Repeating Bauhaus shapes */}
                {[...Array(8)].map((_, i) => (
                    <g key={`group-${i}`} transform={`translate(${i * 100}, 15)`}>
                        {/* Semi circle up */}
                        <path d="M 10 30 A 15 15 0 0 1 40 30 Z" fill="#386642" />
                        {/* Circle */}
                        <circle cx="60" cy="20" r="12" fill="#CADEDF" opacity="0.9" />
                        {/* Semi circle down */}
                        <path d="M 75 10 A 12 12 0 0 0 99 10 Z" fill="#FFEBCC" />
                        {/* Triangle */}
                        <polygon points="45,30 55,10 65,30" fill="#FFEBCC" />
                    </g>
                ))}

                {/* Sawtooth border bottom */}
                {[...Array(20)].map((_, i) => (
                    <polygon key={`b-${i}`} points={`${i * 40},60 ${i * 40 + 20},50 ${i * 40 + 40},60`} fill="#CADEDF" />
                ))}
            </svg>
        );
    }

    return (
        <svg 
            className={`h-full w-auto overflow-hidden ${className}`} 
            viewBox="0 0 120 480" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect width="120" height="480" fill="#1D2729" />
            
            {/* Top Sawtooth */}
            <polygon points="0,0 15,18 30,0" fill="#CADEDF" />
            <polygon points="30,0 45,18 60,0" fill="#CADEDF" />
            <polygon points="60,0 75,18 90,0" fill="#CADEDF" />
            <polygon points="90,0 105,18 120,0" fill="#CADEDF" />

            {/* Pattern Section 1 */}
            <path d="M 10 70 A 25 25 0 0 1 60 70 Z" fill="#386642" />
            <path d="M 65 70 A 25 25 0 0 0 115 70 Z" fill="#FFEBCC" />
            
            <circle cx="35" cy="115" r="22" fill="#FFEBCC" />
            <circle cx="85" cy="115" r="22" fill="#CADEDF" />

            {/* Conical teardrop & half-circle */}
            <polygon points="35,145 10,200 60,200" fill="#CADEDF" />
            <path d="M 65 170 A 25 25 0 0 1 115 170 Z" fill="#FFEBCC" />
            <circle cx="90" cy="195" r="18" fill="#386642" />

            {/* Middle Section */}
            <path d="M 10 240 A 25 25 0 0 0 60 240 Z" fill="#386642" />
            <path d="M 65 240 A 25 25 0 0 1 115 240 Z" fill="#386642" />
            
            <polygon points="35,260 10,315 60,315" fill="#FFEBCC" />
            <circle cx="88" cy="285" r="22" fill="#CADEDF" />

            {/* Lower Section */}
            <circle cx="35" cy="350" r="20" fill="#386642" />
            <circle cx="85" cy="350" r="20" fill="#FFEBCC" />

            <path d="M 10 400 A 25 25 0 0 1 60 400 Z" fill="#FFEBCC" />
            <path d="M 65 400 A 25 25 0 0 0 115 400 Z" fill="#386642" />

            {/* Bottom Sawtooth */}
            <polygon points="0,480 15,462 30,480" fill="#CADEDF" />
            <polygon points="30,480 45,462 60,480" fill="#CADEDF" />
            <polygon points="60,480 75,462 90,480" fill="#CADEDF" />
            <polygon points="90,480 105,462 120,480" fill="#CADEDF" />
        </svg>
    );
}

export default AfrihausPattern;
