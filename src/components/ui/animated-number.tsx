"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
    value: number;
    duration?: number;
    delay?: number;
    className?: string;
    suffix?: string;
    prefix?: string;
    decimals?: number;
}

export function AnimatedNumber({
    value,
    duration = 1500,
    delay = 0,
    className = "",
    suffix = "",
    prefix = "",
    decimals = 0,
}: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);

                    // Start animation after delay
                    setTimeout(() => {
                        const startTime = performance.now();
                        const startValue = 0;
                        const endValue = value;

                        const animate = (currentTime: number) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);

                            // Easing function (ease-out-expo)
                            const eased = 1 - Math.pow(1 - progress, 4);

                            const currentValue = startValue + (endValue - startValue) * eased;
                            setDisplayValue(currentValue);

                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            } else {
                                setDisplayValue(endValue);
                            }
                        };

                        requestAnimationFrame(animate);
                    }, delay);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [value, duration, delay, hasAnimated]);

    const formattedValue = decimals > 0
        ? displayValue.toFixed(decimals)
        : Math.round(displayValue);

    return (
        <span ref={ref} className={`tabular-nums ${className}`}>
            {prefix}{formattedValue}{suffix}
        </span>
    );
}
