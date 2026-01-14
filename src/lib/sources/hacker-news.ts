import { RawPost } from "@/types/pulse";

// Intent-augmented query suffixes
// Intent-based query templates
const INTENT_QUERIES = [
    "best {K}",
    "{K} alternative",
    "alternative to {K}",
    "{K} pricing",
    "recommend {K}",
    "problem with {K}",
    "looking for {K}",
];

interface HNHit {
    objectID: string;
    title: string;
    url: string | null;
    story_text: string | null;
    points: number;
    num_comments: number;
    created_at_i: number;
    author: string;
}

interface HNSearchResponse {
    hits: HNHit[];
    nbPages: number;
}

/**
 * Fetch a single HN search with time filter
 */
async function fetchHNSearch(query: string, sinceTimestamp: number): Promise<RawPost[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=50&numericFilters=created_at_i>${sinceTimestamp}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`HN API error: ${response.status}`);
            return [];
        }

        const data: HNSearchResponse = await response.json();

        return data.hits.map((hit) => ({
            id: hit.objectID,
            title: hit.title || "",
            body: hit.story_text || "",
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: "hackernews" as const,
            score: hit.points || 0,
            comments: hit.num_comments || 0,
            createdAt: new Date(hit.created_at_i * 1000),
            author: hit.author,
        }));
    } catch (error) {
        console.error("Failed to fetch HN:", error);
        return [];
    }
}

/**
 * Generate dedupe signature for a post
 */
function getDedupeSignature(post: RawPost): string {
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
function deduplicatePosts(posts: RawPost[]): RawPost[] {
    const signatureMap = new Map<string, RawPost>();

    for (const post of posts) {
        const sig = getDedupeSignature(post);
        const existing = signatureMap.get(sig);

        if (!existing) {
            signatureMap.set(sig, post);
        } else {
            const existingScore = existing.score + existing.comments * 2;
            const newScore = post.score + post.comments * 2;
            if (newScore > existingScore) {
                signatureMap.set(sig, post);
            }
        }
    }

    return Array.from(signatureMap.values());
}

/**
 * Fetch posts from Hacker News for a specific time window
 */
async function fetchHNForWindow(
    query: string,
    daysAgo: number
): Promise<RawPost[]> {
    const sinceTimestamp = Math.floor((Date.now() - daysAgo * 24 * 60 * 60 * 1000) / 1000);
    const allPosts: RawPost[] = [];
    const seenIds = new Set<string>();

    // Use fewer intent queries for older data
    const numQueries = daysAgo <= 7 ? 4 : 2;
    const queries = INTENT_QUERIES.slice(0, numQueries).map((template) =>
        template.replace("{K}", query)
    );

    for (let i = 0; i < queries.length; i++) {
        const q = queries[i];

        if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const posts = await fetchHNSearch(q, sinceTimestamp);

        for (const post of posts) {
            if (!seenIds.has(post.id)) {
                seenIds.add(post.id);
                allPosts.push(post);
            }
        }
    }

    return allPosts;
}

/**
 * Fetch posts from Hacker News with separate weekly and monthly windows
 * Returns { weekly: posts from last 7d, monthly: posts from last 30d }
 */
export async function fetchHNPosts(query: string): Promise<{
    weekly: RawPost[];
    monthly: RawPost[];
}> {
    // Fetch both time windows
    const [weeklyRaw, monthlyRaw] = await Promise.all([
        fetchHNForWindow(query, 7),
        fetchHNForWindow(query, 30),
    ]);

    // Filter: HN posts with very low engagement are noise
    const filterPosts = (posts: RawPost[]) =>
        posts.filter((post) => {
            if (post.score < 2 && post.comments < 2) return false;
            if (post.title.length < 20) return false;
            return true;
        });

    const weeklyFiltered = filterPosts(weeklyRaw);
    const monthlyFiltered = filterPosts(monthlyRaw);

    // Deduplicate
    const weekly = deduplicatePosts(weeklyFiltered);
    const monthly = deduplicatePosts(monthlyFiltered);

    console.log(
        `HN: Weekly ${weeklyRaw.length} → ${weekly.length}, Monthly ${monthlyRaw.length} → ${monthly.length}`
    );

    return { weekly, monthly };
}

/**
 * Get top HN threads breakdown
 */
// Self-register with the source registry
import { registerSource, BreakdownItem } from "./registry";

/**
 * Get top HN threads breakdown
 */
export function getHNBreakdown(posts: RawPost[]): BreakdownItem[] {
    return posts
        .filter((p) => p.source === "hackernews")
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((post) => ({
            label: post.title.length > 50 ? post.title.slice(0, 47) + "..." : post.title,
            url: post.url,
            count: post.score,
        }));
}

// Wrapper to return flat array (HN has weekly/monthly structure)
async function fetchHNPostsFlat(query: string): Promise<RawPost[]> {
    const { monthly } = await fetchHNPosts(query);
    return monthly;
}

registerSource({
    id: "hackernews",
    name: "Hacker News",
    color: "orange-400",
    icon: null,
    fetch: fetchHNPostsFlat,
    getBreakdown: getHNBreakdown,
    breakdownTitle: "Top Discussions",
});
