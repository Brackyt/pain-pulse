"use client";

import { useState } from "react";
import { FlameIcon, CopyIcon, CheckIcon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
        <ScrollReveal>
            <div className="pulse-card p-6 md:p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
                        <FlameIcon size={24} className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Top Frictions</h3>
                        <p className="text-sm text-white/40">Real pain points from the community</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {frictions.map((friction, index) => (
                        <ScrollReveal key={index} delay={index * 80}>
                            <div
                                className="group flex gap-4 p-4 md:p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 transition-all duration-300"
                            >
                                <span className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 text-red-400 text-sm font-bold flex items-center justify-center border border-red-500/20">
                                    {index + 1}
                                </span>
                                <p className="flex-1 text-white/80 text-sm md:text-base leading-relaxed">
                                    {friction}
                                </p>
                                <button
                                    onClick={() => handleCopy(friction, index)}
                                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                    title="Copy"
                                >
                                    {copiedIndex === index ? (
                                        <CheckIcon size={16} className="text-emerald-400" />
                                    ) : (
                                        <CopyIcon size={16} />
                                    )}
                                </button>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </ScrollReveal>
    );
}
