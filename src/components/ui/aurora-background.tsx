"use client";

import { useEffect, useRef } from "react";

interface AuroraBackgroundProps {
    children?: React.ReactNode;
    className?: string;
    intensity?: "subtle" | "medium" | "strong";
}

export function AuroraBackground({
    children,
    className = "",
    intensity = "medium",
}: AuroraBackgroundProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Subtle mouse parallax effect
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { innerWidth, innerHeight } = window;
            
            const x = (clientX / innerWidth - 0.5) * 20;
            const y = (clientY / innerHeight - 0.5) * 20;
            
            container.style.setProperty("--aurora-x", `${x}px`);
            container.style.setProperty("--aurora-y", `${y}px`);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const intensityClasses = {
        subtle: "aurora-subtle",
        medium: "aurora-medium",
        strong: "aurora-strong",
    };

    return (
        <div
            ref={containerRef}
            className={`aurora-container ${intensityClasses[intensity]} ${className}`}
            style={{
                "--aurora-x": "0px",
                "--aurora-y": "0px",
            } as React.CSSProperties}
        >
            {/* Aurora layers */}
            <div className="aurora-layer aurora-layer-1" />
            <div className="aurora-layer aurora-layer-2" />
            <div className="aurora-layer aurora-layer-3" />
            
            {/* Floating orbs */}
            <div className="aurora-orb aurora-orb-1" />
            <div className="aurora-orb aurora-orb-2" />
            <div className="aurora-orb aurora-orb-3" />
            
            {/* Noise texture overlay */}
            <div className="aurora-noise" />
            
            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
