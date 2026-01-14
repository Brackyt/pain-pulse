"use client";

import { cn } from "@/lib/utils";

interface IconProps {
    className?: string;
    size?: number;
}

// Custom Pulse/Heartbeat icon for branding
export function PulseIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn("", className)}
        >
            <path
                d="M3 12h4l3-9 4 18 3-9h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// Fire/Flame icon for friction/pain
export function FlameIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn("", className)}
        >
            <path
                d="M12 2c.5 2.5 2 4.5 2 7 0 2.5-2 4.5-2 4.5s-2-2-2-4.5c0-2.5 1.5-4.5 2-7z"
                fill="currentColor"
                opacity="0.3"
            />
            <path
                d="M8.5 8.5c1 2 1.5 3.5 1.5 5.5 0 3-2 4-2 4s4 1.5 6 0 2-4 2-4-.5-3.5-1.5-5.5c0 0-1 2-3 2s-3-2-3-2z"
                fill="currentColor"
            />
            <path
                d="M12 22c-3 0-5-2-5-5 0-2 1-4 2.5-5.5.5 1.5 1.5 2.5 2.5 2.5s2-1 2.5-2.5c1.5 1.5 2.5 3.5 2.5 5.5 0 3-2 5-5 5z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
        </svg>
    );
}

// Chart/Trending icon for spikes
export function TrendingIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn("", className)}
        >
            <path
                d="M2 20h20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.3"
            />
            <path
                d="M4 16l4-4 4 2 8-10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M16 4h4v4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

// Quote marks icon for receipts
export function QuoteIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            className={cn("", className)}
        >
            <path
                d="M10 8c-1.1 0-2 .9-2 2v6h4v-4H9.5c.3-2.5 2.5-2 2.5-2V8h-2zm8 0c-1.1 0-2 .9-2 2v6h4v-4h-2.5c.3-2.5 2.5-2 2.5-2V8h-2z"
                opacity="0.8"
            />
        </svg>
    );
}

// Target/Crosshair icon for opportunities
export function TargetIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn("", className)}
        >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" opacity="0.5" />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
            <path
                d="M12 2v4M12 18v4M2 12h4M18 12h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.5"
            />
        </svg>
    );
}

// Pain Index icon (broken heart / gauge)
export function PainGaugeIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn("", className)}
        >
            <path
                d="M12 4a8 8 0 0 0-8 8h16a8 8 0 0 0-8-8z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
            />
            <path
                d="M4 12a8 8 0 0 0 16 0"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
            />
            <path
                d="M12 12l3-5"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
    );
}

// Rocket icon for build ideas
export function RocketIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn("", className)}
        >
            <path
                d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
            />
            <path
                d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.5"
            />
        </svg>
    );
}

// Volume/Mentions icon
export function VolumeIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={cn("", className)}
        >
            <rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="10" y="10" width="4" height="10" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" />
        </svg>
    );
}

// Copy icon
export function CopyIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("", className)}
        >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
    );
}

// Check icon for copy confirmation
export function CheckIcon({ className, size = 24 }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("", className)}
        >
            <path d="M20 6L9 17l-5-5" />
        </svg>
    );
}

