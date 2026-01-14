"use client";

import { useState } from "react";
import { FlameIcon, CopyIcon, CheckIcon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

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
        <ScrollReveal>
            <div className="pulse-card p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
                        <FlameIcon size={24} className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Pain Receipts</h3>
                        <p className="text-sm text-white/40">Direct quotes from discussions</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {quotes.map((quote, index) => (
                        <ScrollReveal key={index} delay={index * 60}>
                            <div className="group relative h-full p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-500/20 transition-all duration-300">
                                {/* Quote mark decoration */}
                                <div className="absolute top-4 left-4 text-4xl text-orange-500/10 font-serif leading-none pointer-events-none">
                                    &ldquo;
                                </div>

                                <div className="relative pl-4" style={{
                                    borderLeft: "2px solid",
                                    borderImage: "linear-gradient(180deg, #f97316 0%, #ef4444 100%) 1"
                                }}>
                                    <p className="text-white/70 text-sm md:text-base leading-relaxed pr-8">
                                        {quote}
                                    </p>
                                </div>

                                <button
                                    onClick={() => handleCopy(quote, index)}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                    title="Copy"
                                >
                                    {copiedIndex === index ? (
                                        <CheckIcon size={14} className="text-emerald-400" />
                                    ) : (
                                        <CopyIcon size={14} />
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
