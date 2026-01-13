"use client";

import { useState } from "react";

interface FrictionsListProps {
    frictions: string[];
}

export function FrictionsList({ frictions }: FrictionsListProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = async (text: string, index: number) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    if (!frictions || frictions.length === 0) {
        return null;
    }

    return (
        <div className="bg-red-500/5 backdrop-blur-sm border border-red-500/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-red-100 mb-6 flex items-center gap-2">
                <span className="animate-pulse">🔥</span> Top Frictions (Real Pain)
            </h3>

            <div className="space-y-3">
                {frictions.map((friction, index) => (
                    <button
                        key={index}
                        onClick={() => handleCopy(friction, index)}
                        className="w-full group text-left p-4 bg-red-900/10 hover:bg-red-900/20 border border-red-500/10 hover:border-red-500/20 rounded-xl transition-all duration-200"
                    >
                        <div className="flex gap-4">
                            <span className="text-red-400 font-bold">•</span>
                            <p className="text-red-100/90 text-md font-medium leading-relaxed">
                                {friction}
                            </p>
                        </div>
                        <p className="pl-6 mt-2 text-xs text-red-200/30 group-hover:text-red-200/50 transition-colors">
                            {copiedIndex === index ? "✓ Copied!" : "Click to copy friction point"}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
