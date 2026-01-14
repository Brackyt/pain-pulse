"use client";

import { useState } from "react";
import { FlameIcon, CopyIcon, CheckIcon } from "@/components/ui/icons";

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
        <div className="pulse-card pulse-card-pain p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <FlameIcon size={20} className="text-red-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Top Frictions</h3>
                    <p className="text-sm text-white/40">Real pain points from the community</p>
                </div>
            </div>

            <div className="space-y-3">
                {frictions.map((friction, index) => (
                    <div
                        key={index}
                        className="group flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 hover:bg-red-500/[0.03] transition-all duration-200"
                    >
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-red-500/10 text-red-400 text-sm font-bold flex items-center justify-center">
                            {index + 1}
                        </span>
                        <p className="flex-1 text-white/80 text-sm leading-relaxed">
                            {friction}
                        </p>
                        <button
                            onClick={() => handleCopy(friction, index)}
                            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                            title="Copy"
                        >
                            {copiedIndex === index ? (
                                <CheckIcon size={16} className="text-emerald-400" />
                            ) : (
                                <CopyIcon size={16} />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
