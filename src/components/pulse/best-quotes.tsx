"use client";

import { useState } from "react";

interface BestQuotesProps {
    quotes: string[];
}

export function BestQuotes({ quotes }: BestQuotesProps) {
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleCopy = async (quote: string, index: number) => {
        try {
            await navigator.clipboard.writeText(quote);
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    if (quotes.length === 0) {
        return null;
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span>🔥</span> Best Receipts (from comments)
            </h3>
            <p className="text-sm text-white/40 mb-4">
                Real quotes from Reddit comments showing actual pain & intent
            </p>

            <div className="space-y-3">
                {quotes.map((quote, index) => (
                    <button
                        key={index}
                        onClick={() => handleCopy(quote, index)}
                        className="w-full group text-left p-4 bg-gradient-to-r from-red-500/5 to-orange-500/5 hover:from-red-500/10 hover:to-orange-500/10 border border-white/5 hover:border-white/10 rounded-xl transition-all duration-200"
                    >
                        <p className="text-white/80 text-sm leading-relaxed">
                            "{quote}"
                        </p>
                        <p className="mt-2 text-xs text-white/30 group-hover:text-white/50 transition-colors">
                            {copiedIndex === index ? "✓ Copied!" : "Click to copy"}
                        </p>
                    </button>
                ))}
            </div>
        </div>
    );
}
