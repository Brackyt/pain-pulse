"use client";

import { Theme } from "@/types/pulse";
import { Badge } from "@/components/ui/badge";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface ThemesListProps {
    themes: Theme[];
}

export function ThemesList({ themes }: ThemesListProps) {
    if (themes.length === 0) {
        return (
            <div className="pulse-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Pain Themes</h3>
                <p className="text-white/40">No distinct themes detected.</p>
            </div>
        );
    }

    return (
        <ScrollReveal>
            <div className="pulse-card p-6 md:p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white">Pain Themes</h3>
                </div>

                <div className="space-y-6">
                    {themes.map((theme, index) => (
                        <ScrollReveal key={`${index}-${theme.title}`} delay={index * 80}>
                            <div className="relative group">
                                {/* Theme header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center text-sm font-bold text-violet-300 group-hover:shadow-lg group-hover:shadow-violet-500/20 transition-shadow">
                                        {index + 1}
                                    </span>
                                    <h4 className="text-white font-medium flex-1 truncate">{theme.title}</h4>
                                    <Badge
                                        variant="outline"
                                        className="text-violet-400 border-violet-400/20 bg-violet-500/10 text-xs shrink-0 tabular-nums"
                                    >
                                        {theme.share}%
                                    </Badge>
                                </div>

                                {/* Progress bar for theme share */}
                                <div className="ml-11 mb-3">
                                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700"
                                            style={{ width: `${theme.share}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Quotes */}
                                {theme.quotes.length > 0 && (
                                    <div className="ml-11 space-y-2 mb-3">
                                        {theme.quotes.slice(0, 2).map((quote, i) => (
                                            <p
                                                key={i}
                                                className="text-sm text-white/50 py-2 px-3 rounded-lg bg-white/[0.02] border-l-2 border-violet-500/30"
                                            >
                                                &ldquo;{quote}&rdquo;
                                            </p>
                                        ))}
                                    </div>
                                )}

                                {/* Sources */}
                                {theme.sources.length > 0 && (
                                    <div className="ml-11 flex flex-wrap gap-2">
                                        {theme.sources.slice(0, 3).map((source, i) => (
                                            <a
                                                key={i}
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-sky-400/70 hover:text-sky-400 hover:underline underline-offset-2 px-2 py-1 rounded-md bg-sky-500/5 hover:bg-sky-500/10 transition-colors"
                                            >
                                                {source.source === "reddit" ? "r/" : ""}
                                                {source.title.slice(0, 25)}...
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </ScrollReveal>
    );
}
