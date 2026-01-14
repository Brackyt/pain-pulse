"use client";

import { useState } from "react";
import { TopPhrase } from "@/types/pulse";
import { QuoteIcon, CopyIcon, CheckIcon } from "@/components/ui/icons";

interface QuotesSectionProps {
    phrases: TopPhrase[];
}

export function QuotesSection({ phrases }: QuotesSectionProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = async (phrase: string, index: number) => {
        try {
            await navigator.clipboard.writeText(phrase);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    if (phrases.length === 0) {
        return (
            <div className="pulse-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <QuoteIcon size={20} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Top Phrasing</h3>
                </div>
                <p className="text-white/40">No notable phrases detected.</p>
            </div>
        );
    }

    return (
        <div className="pulse-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <QuoteIcon size={20} className="text-amber-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Top Phrasing</h3>
                    <p className="text-sm text-white/40">Common phrases & patterns</p>
                </div>
            </div>

            <div className="space-y-2">
                {phrases.map((phrase, index) => (
                    <div
                        key={index}
                        className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 hover:bg-amber-500/[0.02] transition-all"
                    >
                        <span className="shrink-0 text-xs text-white/30 tabular-nums w-8 text-right">
                            {phrase.count}×
                        </span>
                        <span className="flex-1 text-white/70 text-sm truncate">
                            "{phrase.phrase}"
                        </span>
                        <button
                            onClick={() => handleCopy(phrase.phrase, index)}
                            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
                            title="Copy"
                        >
                            {copiedIndex === index ? (
                                <CheckIcon size={14} className="text-emerald-400" />
                            ) : (
                                <CopyIcon size={14} />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
