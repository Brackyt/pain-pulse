import { RawPost } from "@/types/pulse";

// Intent-augmented query suffixes
const INTENT_QUERIES = [
    "", // base query
    "alternative",
    "recommend",
    "problem",
    "looking for",
    "frustrated",
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
 * Fetch a single HN search
 */
async function fetchHNSearch(query: string): Promise<RawPost[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=50`;

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
 * Fetch posts from Hacker News using intent-augmented queries
 */
export async function fetchHNPosts(query: string): Promise<RawPost[]> {
    const allPosts: RawPost[] = [];
    const seenIds = new Set<string>();

    // Build intent-augmented queries (fewer for HN since it's faster)
    const queries = INTENT_QUERIES.slice(0, 4).map((suffix) =>
        suffix ? `${query} ${suffix}` : query
    );

    for (let i = 0; i < queries.length; i++) {
        const q = queries[i];

        if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const posts = await fetchHNSearch(q);

        for (const post of posts) {
            if (!seenIds.has(post.id)) {
                seenIds.add(post.id);
                allPosts.push(post);
            }
        }
    }

    // Filter: HN posts with very low engagement are noise
    const filtered = allPosts.filter((post) => {
        // Require at least some engagement
        if (post.score < 2 && post.comments < 2) return false;
        // Title must be substantial
        if (post.title.length < 20) return false;
        return true;
    });

    // Deduplicate
    const deduped = deduplicatePosts(filtered);

    console.log(
        `HN: Fetched ${allPosts.length} raw → ${filtered.length} filtered → ${deduped.length} unique`
    );

    return deduped;
}

/**
 * Get top HN threads breakdown
 */
export function getHNBreakdown(
    posts: RawPost[]
): { title: string; url: string; points: number }[] {
    return posts
        .filter((p) => p.source === "hackernews")
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((post) => ({
            title: post.title,
            url: post.url,
            points: post.score,
        }));
}
