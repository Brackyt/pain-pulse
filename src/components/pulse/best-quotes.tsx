"use client";

import { useState } from "react";
import { FlameIcon, CopyIcon, CheckIcon } from "@/components/ui/icons";

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
        <div className="pulse-card p-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <FlameIcon size={20} className="text-orange-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Pain Receipts</h3>
                    <p className="text-sm text-white/40">Direct quotes from discussions</p>
                </div>
            </div>

            <div className="mt-6 space-y-3">
                {quotes.map((quote, index) => (
                    <div
                        key={index}
                        className="group relative pull-quote p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-500/20 hover:bg-orange-500/[0.02] transition-all duration-200"
                    >
                        <p className="text-white/70 text-sm leading-relaxed not-italic pr-10">
                            "{quote}"
                        </p>
                        <button
                            onClick={() => handleCopy(quote, index)}
                            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
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
