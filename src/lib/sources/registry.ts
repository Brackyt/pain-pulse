import { RawPost } from "@/types/pulse";
import { ReactNode } from "react";

/**
 * Generic breakdown item for any source
 */
export interface BreakdownItem {
    label: string;      // Display label (e.g. "r/webdev", "vercel/next.js", "#react")
    url: string;        // Link to the source
    count: number;      // Number of posts from this item
}

/**
 * Configuration for a data source
 */
export interface SourceConfig {
    id: string;                                         // Unique identifier (e.g. "reddit")
    name: string;                                       // Display name (e.g. "Reddit")
    color: string;                                      // Tailwind color class (e.g. "orange-500")
    icon: ReactNode;                                    // SVG icon element
    fetch: (query: string) => Promise<RawPost[]>;      // Fetch function
    getBreakdown: (posts: RawPost[]) => BreakdownItem[]; // Breakdown extraction
    breakdownTitle: string;                            // e.g. "Top Subreddits"
}

// Registry of all sources
const sources: Map<string, SourceConfig> = new Map();

/**
 * Register a source with the registry
 */
export function registerSource(config: SourceConfig): void {
    if (sources.has(config.id)) {
        console.warn(`Source "${config.id}" already registered, overwriting.`);
    }
    sources.set(config.id, config);
}

/**
 * Get all registered sources
 */
export function getAllSources(): SourceConfig[] {
    return Array.from(sources.values());
}

/**
 * Get a source by ID
 */
export function getSourceById(id: string): SourceConfig | undefined {
    return sources.get(id);
}

/**
 * Get source IDs
 */
export function getSourceIds(): string[] {
    return Array.from(sources.keys());
}
