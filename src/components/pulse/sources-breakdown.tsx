"use client";

import { SourceBreakdown, BreakdownItem } from "@/types/pulse";
import { getSourceById, SourceIcon } from "@/lib/sources";

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

// Helper to handle legacy data structures from cached reports
function normalizeItem(item: BreakdownItem, sourceId: string): BreakdownItem {
    const raw = item as any;

    // If it already has a label, it's the new format
    if (raw.label) return item;

    // Reddit legacy: { subreddit, count }
    if (sourceId === 'reddit' && raw.subreddit) {
        return {
            label: `r/${raw.subreddit}`,
            url: `https://reddit.com/r/${raw.subreddit}`,
            count: raw.count || 0
        };
    }

    // Hacker News legacy: { title, points, url }
    if (sourceId === 'hackernews' && raw.title) {
        return {
            label: raw.title,
            url: raw.url || "",
            count: raw.points || raw.count || 0
        };
    }

    // GitHub legacy: { name, count, url }
    if (sourceId === 'github' && raw.name) {
        return {
            label: raw.name,
            url: raw.url || "",
            count: raw.count || 0
        };
    }

    // Dev.to legacy: { tag, count, url }
    if (sourceId === 'devto' && raw.tag) {
        return {
            label: `#${raw.tag}`,
            url: raw.url || "",
            count: raw.count || 0
        };
    }

    return { label: "", url: "", count: 0 };
}

function SourceSection({ sourceId, items }: { sourceId: string; items: BreakdownItem[] }) {
    if (!items || items.length === 0) return null;

    // Get source config from registry
    const sourceConfig = getSourceById(sourceId);

    // Use registry data or fallbacks
    const title = sourceConfig?.breakdownTitle || `Top ${sourceId}`;
    const color = sourceConfig?.color || "text-gray-200";
    const icon = sourceConfig?.icon || DEFAULT_ICON;

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <SourceIconComponent icon={icon} />
                <h4 className={`text-sm font-medium ${color}`}>{title}</h4>
            </div>
            <div className="space-y-2">
                {items.slice(0, 5).map((rawItem, index) => {
                    const item = normalizeItem(rawItem, sourceId);
                    return (
                        <div
                            key={item.label || index}
                            className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                        >
                            <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/60 hover:text-white hover:underline underline-offset-2 line-clamp-1"
                            >
                                {item.label}
                            </a>
                            <span className="text-white/30 tabular-nums">{item.count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
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

    return (
        <div className="pulse-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Sources</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {sourceIds.map(sourceId => (
                    <SourceSection
                        key={sourceId}
                        sourceId={sourceId}
                        items={breakdown[sourceId]}
                    />
                ))}
            </div>
        </div>
    );
}
