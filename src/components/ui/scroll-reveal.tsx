"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    direction?: "up" | "down" | "left" | "right" | "none";
    distance?: number;
    once?: boolean;
}

export function ScrollReveal({
    children,
    className = "",
    delay = 0,
    duration = 600,
    direction = "up",
    distance = 30,
    once = true,
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once && ref.current) {
                        observer.unobserve(ref.current);
                    }
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            {
                threshold: 0,
                rootMargin: "0px 0px 100px 0px", // Trigger 100px before element enters viewport
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [once]);

    const getTransform = () => {
        if (isVisible) return "translate3d(0, 0, 0)";

        switch (direction) {
            case "up":
                return `translate3d(0, ${distance}px, 0)`;
            case "down":
                return `translate3d(0, -${distance}px, 0)`;
            case "left":
                return `translate3d(${distance}px, 0, 0)`;
            case "right":
                return `translate3d(-${distance}px, 0, 0)`;
            case "none":
                return "translate3d(0, 0, 0)";
            default:
                return `translate3d(0, ${distance}px, 0)`;
        }
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: getTransform(),
                transition: `opacity ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
                willChange: "opacity, transform",
            }}
        >
            {children}
        </div>
    );
}

// Convenience component for staggered reveals
interface StaggeredRevealProps {
    children: ReactNode[];
    className?: string;
    staggerDelay?: number;
    baseDelay?: number;
}

export function StaggeredReveal({
    children,
    className = "",
    staggerDelay = 100,
    baseDelay = 0,
}: StaggeredRevealProps) {
    return (
        <>
            {children.map((child, index) => (
                <ScrollReveal
                    key={index}
                    delay={baseDelay + index * staggerDelay}
                    className={className}
                >
                    {child}
                </ScrollReveal>
            ))}
        </>
    );
}
