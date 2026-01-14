"use client";

import { useEffect, useRef, useState } from "react";

interface RadialGaugeProps {
    value: number;
    maxValue?: number;
    size?: number;
    strokeWidth?: number;
    type: "pain" | "opportunity" | "neutral";
    label?: string;
    suffix?: string;
    className?: string;
    animated?: boolean;
}

const colorSchemes = {
    pain: {
        gradient: ["#ef4444", "#f97316", "#fbbf24"],
        glow: "rgba(239, 68, 68, 0.4)",
        text: "text-red-400",
    },
    opportunity: {
        gradient: ["#22c55e", "#10b981", "#34d399"],
        glow: "rgba(34, 197, 94, 0.4)",
        text: "text-emerald-400",
    },
    neutral: {
        gradient: ["#3b82f6", "#6366f1", "#8b5cf6"],
        glow: "rgba(59, 130, 246, 0.4)",
        text: "text-sky-400",
    },
};

export function RadialGauge({
    value,
    maxValue = 100,
    size = 140,
    strokeWidth = 10,
    type,
    label,
    suffix = "",
    className = "",
    animated = true,
}: RadialGaugeProps) {
    const [animatedValue, setAnimatedValue] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const scheme = colorSchemes[type];
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    // Observe when gauge becomes visible
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    // Animate the value
    useEffect(() => {
        if (!isVisible || !animated) {
            setAnimatedValue(value);
            return;
        }

        const duration = 1500;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);

            setAnimatedValue(value * eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, isVisible, animated]);

    const percentage = animatedValue / maxValue;
    const strokeDashoffset = circumference * (1 - percentage);
    const gradientId = `gauge-gradient-${type}-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div ref={ref} className={`relative inline-flex flex-col items-center ${className}`}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
                style={{
                    overflow: "visible",
                    filter: isVisible ? `drop-shadow(0 0 20px ${scheme.glow})` : "none",
                    transition: "filter 0.5s ease-out",
                }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={scheme.gradient[0]} />
                        <stop offset="50%" stopColor={scheme.gradient[1]} />
                        <stop offset="100%" stopColor={scheme.gradient[2]} />
                    </linearGradient>
                </defs>

                {/* Background track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={strokeWidth}
                />

                {/* Animated progress arc */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        transition: animated ? "stroke-dashoffset 0.1s ease-out" : "none",
                    }}
                />

                {/* Glow effect circle (blurred duplicate) */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth + 4}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    opacity={0.3}
                    style={{
                        filter: "blur(8px)",
                        transition: animated ? "stroke-dashoffset 0.1s ease-out" : "none",
                    }}
                />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-bold tabular-nums ${scheme.text}`}>
                    {Math.round(animatedValue)}
                </span>
                {suffix && (
                    <span className="text-sm text-white/30">{suffix}</span>
                )}
            </div>

            {/* Label below */}
            {label && (
                <span className="mt-3 text-xs text-white/50 uppercase tracking-wider">
                    {label}
                </span>
            )}
        </div>
    );
}
