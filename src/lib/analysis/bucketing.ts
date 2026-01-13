import { RawPost, Theme, SourceLink } from "@/types/pulse";
import { extractBestQuotes } from "./signals"; // Will enable this next

/**
 * Static Intent Buckets
 * Stable categories that work for any product/topic query.
 */
const BUCKETS = {
    alternatives: {
        title: "Alternatives & Competitors",
        keywords: [
            "alternative", "alternatives", "switch", "switching", "replace",
            "replacement", "competitor", "compare", "vs", "versus"
        ]
    },
    pricing: {
        title: "Pricing & Cost",
        keywords: [
            "price", "pricing", "cost", "expensive", "cheap", "free",
            "billing", "subscription", "lifetime deal", "ltd"
        ]
    },
    howto: {
        title: "Setup & How-To",
        keywords: [
            "how to", "how do i", "how do you", "setup", "configure",
            "install", "config", "tutorial", "guide", "help with"
        ]
    },
    opinions: {
        title: "Discussions & Opinions",
        keywords: [
            "think about", "thoughts on", "opinion", "review",
            "experience with", "anyone use", "anyone using"
        ]
    }
};

/**
 * Assign posts to intent buckets based on keyword matching
 */
export async function bucketPosts(
    posts: RawPost[],
    query: string
): Promise<Theme[]> {
    if (posts.length === 0) return [];

    const bucketedPosts: Record<string, RawPost[]> = {
        alternatives: [],
        pricing: [],
        howto: [],
        opinions: [],
    };

    const assignedIds = new Set<string>();

    // Pass 1: Assign to specific buckets
    for (const post of posts) {
        const text = `${post.title} ${post.body}`.toLowerCase();

        let assigned = false;

        // Check each bucket definition
        for (const [key, def] of Object.entries(BUCKETS)) {
            if (def.keywords.some(k => text.includes(k))) {
                bucketedPosts[key].push(post);
                assignedIds.add(post.id);
                assigned = true;
                break; // Assign to first matching bucket (priority order in object keys matches roughly)
            }
        }
    }

    // Pass 2: Anything unassigned goes to "Discussions & Opinions" (fallback)
    // ONLY if it has some engagement, otherwise drop it to reduce noise
    for (const post of posts) {
        if (!assignedIds.has(post.id)) {
            if (post.score >= 2 || post.comments >= 2) {
                bucketedPosts.opinions.push(post);
            }
        }
    }

    // Convert to Themes
    const themes: Theme[] = [];
    const totalPosts = posts.length;

    for (const [key, postsInBucket] of Object.entries(bucketedPosts)) {
        if (postsInBucket.length === 0) continue;

        const def = BUCKETS[key as keyof typeof BUCKETS];

        // Calculate share
        const share = Math.round((postsInBucket.length / totalPosts) * 100);

        // Extract quotes (guaranteed to return something)
        const quotes = extractBestQuotes(postsInBucket, query, 3);

        // Sources
        const sources: SourceLink[] = postsInBucket
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(p => ({
                title: p.title,
                url: p.url,
                source: p.source
            }));

        themes.push({
            title: def.title,
            share,
            quotes,
            sources
        });
    }

    // Sort themes by share (descending)
    return themes.sort((a, b) => b.share - a.share);
}
