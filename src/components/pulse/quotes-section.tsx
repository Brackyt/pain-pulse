"use client";

import { useState } from "react";
import { TopPhrase } from "@/types/pulse";

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
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Phrases</h3>
                <p className="text-white/40">No notable phrases detected.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span>💬</span> Top Phrasing (Receipts)
            </h3>

            <div className="space-y-3">
                {phrases.map((phrase, index) => (
                    <button
                        key={index}
                        onClick={() => handleCopy(phrase.phrase, index)}
                        className="w-full group flex items-start gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-left transition-colors"
                    >
                        <span className="text-white/30 text-sm shrink-0">
                            {phrase.count}×
                        </span>
                        <span className="text-white/80 text-sm flex-1">
                            "{phrase.phrase}"
                        </span>
                        <span className="text-white/30 group-hover:text-white/60 text-xs shrink-0 transition-colors">
                            {copiedIndex === index ? "Copied!" : "Click to copy"}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
