"use client";

import { useEffect, useRef, useState } from "react";

interface SparklineProps {
    data: number[];
    width?: number;
    height?: number;
    color?: string;
    gradientFrom?: string;
    gradientTo?: string;
    strokeWidth?: number;
    filled?: boolean;
    animated?: boolean;
    className?: string;
}

export function Sparkline({
    data,
    width = 100,
    height = 32,
    color = "#ef4444",
    gradientFrom,
    gradientTo,
    strokeWidth = 2,
    filled = true,
    animated = true,
    className = "",
}: SparklineProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [animationProgress, setAnimationProgress] = useState(0);
    const ref = useRef<SVGSVGElement>(null);

    // Generate unique ID for gradients
    const gradientId = useRef(`sparkline-${Math.random().toString(36).substr(2, 9)}`);

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

    useEffect(() => {
        if (!isVisible || !animated) {
            setAnimationProgress(1);
            return;
        }

        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimationProgress(eased);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, animated]);

    if (!data || data.length < 2) return null;

    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const range = maxValue - minValue || 1;

    // Calculate points
    const points = data.map((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
        return { x, y };
    });

    // Animate based on progress
    const visiblePoints = Math.floor(points.length * animationProgress);
    const animatedPoints = points.slice(0, Math.max(2, visiblePoints));

    // Create path
    const pathD = animatedPoints
        .map((point, i) => `${i === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ");

    // Create filled area path
    const areaD = pathD +
        ` L ${animatedPoints[animatedPoints.length - 1]?.x || 0} ${height - padding}` +
        ` L ${animatedPoints[0]?.x || 0} ${height - padding} Z`;

    const useGradient = gradientFrom && gradientTo;

    return (
        <svg
            ref={ref}
            width={width}
            height={height}
            className={className}
            style={{ overflow: "visible" }}
        >
            {useGradient && (
                <defs>
                    <linearGradient id={`${gradientId.current}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={gradientFrom} />
                        <stop offset="100%" stopColor={gradientTo} />
                    </linearGradient>
                    <linearGradient id={`${gradientId.current}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={gradientTo} stopOpacity={0} />
                    </linearGradient>
                </defs>
            )}

            {/* Filled area */}
            {filled && (
                <path
                    d={areaD}
                    fill={useGradient ? `url(#${gradientId.current}-fill)` : color}
                    opacity={useGradient ? 1 : 0.15}
                />
            )}

            {/* Line */}
            <path
                d={pathD}
                fill="none"
                stroke={useGradient ? `url(#${gradientId.current}-line)` : color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* End dot */}
            {animatedPoints.length > 0 && (
                <circle
                    cx={animatedPoints[animatedPoints.length - 1].x}
                    cy={animatedPoints[animatedPoints.length - 1].y}
                    r={3}
                    fill={useGradient ? gradientTo : color}
                    style={{
                        filter: `drop-shadow(0 0 4px ${useGradient ? gradientTo : color})`,
                    }}
                />
            )}
        </svg>
    );
}

// Mini bar chart variant
interface MiniBarChartProps {
    data: { label: string; value: number; color?: string }[];
    height?: number;
    animated?: boolean;
    className?: string;
}

export function MiniBarChart({
    data,
    height = 60,
    animated = true,
    className = "",
}: MiniBarChartProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

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

    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div ref={ref} className={`flex items-end gap-1 ${className}`} style={{ height }}>
            {data.map((item, index) => {
                const barHeight = (item.value / maxValue) * 100;
                return (
                    <div
                        key={item.label}
                        className="flex-1 rounded-t-sm transition-all duration-700 ease-out"
                        style={{
                            height: isVisible && animated ? `${barHeight}%` : "0%",
                            backgroundColor: item.color || "#ef4444",
                            transitionDelay: `${index * 50}ms`,
                        }}
                        title={`${item.label}: ${item.value}`}
                    />
                );
            })}
        </div>
    );
}
