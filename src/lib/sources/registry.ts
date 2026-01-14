import { RawPost } from "@/types/pulse";

/**
 * Generic breakdown item for any source
 */
export interface BreakdownItem {
    label: string;      // Display label (e.g. "r/webdev", "vercel/next.js", "#react")
    url: string;        // Link to the source
    count: number;      // Number of posts from this item
}

/**
 * Icon configuration - either an SVG path or custom element type
 */
export interface SourceIcon {
    type: "svg" | "text";
    // For SVG: the path data (d attribute)
    // For text: the text content (e.g. "Y" for HN)
    content: string;
    // CSS classes for the icon container
    className: string;
}

/**
 * Configuration for a data source
 */
export interface SourceConfig {
    id: string;                                         // Unique identifier (e.g. "reddit")
    name: string;                                       // Display name (e.g. "Reddit")
    color: string;                                      // Tailwind text color class (e.g. "text-orange-400")
    icon: SourceIcon;                                   // Icon configuration
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

// ============================================
// Shared Utilities for Source Implementations
// ============================================

/**
 * Generate dedupe signature for a post (normalizes title for comparison)
 */
export function getDedupeSignature(post: RawPost): string {
    const normalized = post.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
    return normalized;
}

/**
 * Deduplicate posts, keeping the one with highest engagement
 */
export function deduplicatePosts(posts: RawPost[]): RawPost[] {
    const signatureMap = new Map<string, RawPost>();

    for (const post of posts) {
        const sig = getDedupeSignature(post);
        const existing = signatureMap.get(sig);

        if (!existing) {
            signatureMap.set(sig, post);
        } else {
            // Keep the one with higher engagement
            const existingScore = existing.score + existing.comments * 2;
            const newScore = post.score + post.comments * 2;
            if (newScore > existingScore) {
                signatureMap.set(sig, post);
            }
        }
    }

    return Array.from(signatureMap.values());
}
