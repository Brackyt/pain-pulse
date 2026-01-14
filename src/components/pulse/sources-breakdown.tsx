"use client";

import { SourceBreakdown, BreakdownItem } from "@/types/pulse";
import { getSourceById, SourceIcon } from "@/lib/sources";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { MiniBarChart } from "@/components/ui/sparkline";

// Sanitize URL to prevent XSS (only allow http/https)
function sanitizeUrl(url: string): string {
    if (!url) return "";
    try {
        const parsed = new URL(url);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") {
            return url;
        }
    } catch {
        // Invalid URL, return empty
    }
    return "";
}

interface SourcesBreakdownProps {
    breakdown: SourceBreakdown;
}

// Render icon from SourceIcon config
function SourceIconComponent({ icon }: { icon: SourceIcon }) {
    if (icon.type === "svg") {
        return (
            <svg className={icon.className} viewBox="0 0 24 24" fill="currentColor">
                <path d={icon.content} />
            </svg>
        );
    }
    // Text type (e.g., "Y" for Hacker News)
    return <span className={icon.className}>{icon.content}</span>;
}

// Default icon for unknown sources
const DEFAULT_ICON: SourceIcon = {
    type: "svg",
    content: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    className: "w-4 h-4 text-gray-400",
};

// Source color mapping for bars
const SOURCE_COLORS: Record<string, string> = {
    reddit: "#ff4500",
    hackernews: "#ff6600",
    github: "#6e5494",
    devto: "#0a0a0a",
    serp: "#4285f4",
};

// Helper to handle legacy data structures from cached reports
function normalizeItem(item: BreakdownItem, sourceId: string): BreakdownItem {
    // Guard against null/undefined/malformed data
    if (!item || typeof item !== 'object') {
        return { label: "", url: "", count: 0 };
    }

    const raw = item as any;

    // If it already has a label, it's the new format
    if (raw.label) return item;

    // Reddit legacy: { subreddit, count }
    if (sourceId === 'reddit' && raw.subreddit) {
        return {
            label: `r/${raw.subreddit}`,
            url: `https://reddit.com/r/${raw.subreddit}`,
            count: (raw.count as number) || 0
        };
    }

    // Hacker News legacy: { title, points, url }
    if (sourceId === 'hackernews' && raw.title) {
        return {
            label: raw.title as string,
            url: (raw.url as string) || "",
            count: (raw.points as number) || (raw.count as number) || 0
        };
    }

    // GitHub legacy: { name, count, url }
    if (sourceId === 'github' && raw.name) {
        return {
            label: raw.name as string,
            url: (raw.url as string) || "",
            count: (raw.count as number) || 0
        };
    }

    // Dev.to legacy: { tag, count, url }
    if (sourceId === 'devto' && raw.tag) {
        return {
            label: `#${raw.tag}`,
            url: (raw.url as string) || "",
            count: (raw.count as number) || 0
        };
    }

    return { label: "", url: "", count: 0 };
}

function SourceSection({ sourceId, items, index }: { sourceId: string; items: BreakdownItem[]; index: number }) {
    if (!items || items.length === 0) return null;

    // Get source config from registry
    const sourceConfig = getSourceById(sourceId);

    // Use registry data or fallbacks
    const title = sourceConfig?.breakdownTitle || `Top ${sourceId}`;
    const color = sourceConfig?.color || "text-gray-200";
    const icon = sourceConfig?.icon || DEFAULT_ICON;
    const barColor = SOURCE_COLORS[sourceId] || "#6366f1";

    // Normalize items
    const normalizedItems = items.slice(0, 5).map(item => normalizeItem(item, sourceId));
    const maxCount = Math.max(...normalizedItems.map(i => i.count));

    return (
        <ScrollReveal delay={index * 100}>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                    <SourceIconComponent icon={icon} />
                    <h4 className={`text-sm font-medium ${color}`}>{title}</h4>
                </div>

                <div className="space-y-3">
                    {normalizedItems.map((item, idx) => {
                        const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        return (
                            <div key={item.label || idx} className="group">
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <a
                                        href={sanitizeUrl(item.url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/60 hover:text-white hover:underline underline-offset-2 line-clamp-1 flex-1 mr-2"
                                    >
                                        {item.label}
                                    </a>
                                    <span className="text-white/40 tabular-nums text-xs">{item.count}</span>
                                </div>
                                {/* Animated bar */}
                                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700 ease-out"
                                        style={{
                                            width: `${barWidth}%`,
                                            backgroundColor: barColor,
                                            boxShadow: `0 0 8px ${barColor}40`
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ScrollReveal>
    );
}

export function SourcesBreakdown({ breakdown }: SourcesBreakdownProps) {
    // Get source IDs that have data
    const sourceIds = Object.keys(breakdown).filter(
        id => breakdown[id] && breakdown[id].length > 0
    );

    if (sourceIds.length === 0) {
        return null;
    }

    // Calculate totals for summary chart
    const sourceTotals = sourceIds.map(id => ({
        label: id,
        value: breakdown[id].reduce((sum, item) => {
            const normalized = normalizeItem(item, id);
            return sum + normalized.count;
        }, 0),
        color: SOURCE_COLORS[id] || "#6366f1"
    }));

    return (
        <ScrollReveal>
            <div className="pulse-card p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">Sources</h3>
                        <p className="text-sm text-white/40">Where the data came from</p>
                    </div>
                    {/* Summary bar chart */}
                    <div className="hidden sm:flex items-center gap-1">
                        <MiniBarChart data={sourceTotals} height={40} />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {sourceIds.map((sourceId, index) => (
                        <SourceSection
                            key={sourceId}
                            sourceId={sourceId}
                            items={breakdown[sourceId]}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </ScrollReveal>
    );
}
