import { RawPost } from "@/types/pulse";

const USER_AGENT = "PainPulse/1.0 (Market Research Tool)";

// Intent-augmented query suffixes to find high-signal posts
// Intent-based query templates to find high-signal posts
const INTENT_QUERIES = [
    "best {K}",
    "{K} alternative",
    "alternative to {K}",
    "{K} pricing",
    "{K} too expensive",
    "looking for {K}",
    "recommend {K}",
    "tool for {K}",
    "how do you {K}",
];

// Meme/low-signal indicators to filter out
const MEME_INDICATORS = [
    "lol",
    "lmao",
    "meme",
    "shitpost",
    "circlejerk",
    "copypasta",
    "satire",
    "joke",
    "funny",
    "haha",
];

interface RedditPost {
    data: {
        id: string;
        title: string;
        selftext: string;
        url: string;
        permalink: string;
        score: number;
        num_comments: number;
        created_utc: number;
        subreddit: string;
        author: string;
        is_self: boolean;
    };
}

interface RedditSearchResponse {
    data: {
        children: RedditPost[];
        after: string | null;
    };
}

/**
 * Fetch a single page of Reddit search results
 */
async function fetchRedditPage(
    query: string,
    timeFilter: string
): Promise<RawPost[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.reddit.com/search.json?q=${encodedQuery}&sort=relevance&t=${timeFilter}&limit=50`;

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
            },
        });

        if (response.status === 403 || response.status === 429) {
            // Throw specific error for rate limiting
            const error = new Error("REDDIT_RATE_LIMITED");
            throw error;
        }

        if (!response.ok) {
            console.error(`Reddit API error: ${response.status}`);
            return [];
        }

        const data: RedditSearchResponse = await response.json();

        return data.data.children.map((post) => ({
            id: post.data.id,
            title: post.data.title,
            body: post.data.selftext || "",
            url: `https://reddit.com${post.data.permalink}`,
            source: "reddit" as const,
            score: post.data.score,
            comments: post.data.num_comments,
            createdAt: new Date(post.data.created_utc * 1000),
            subreddit: post.data.subreddit,
            author: post.data.author,
            isSelf: post.data.is_self,
        }));
    } catch (error) {
        // Re-throw rate limit errors
        if (error instanceof Error && error.message === "REDDIT_RATE_LIMITED") {
            throw error;
        }
        console.error("Failed to fetch Reddit page:", error);
        return [];
    }
}

/**
 * Check if post is a meme/low-signal content
 */
function isMemePost(post: RawPost): boolean {
    const text = `${post.title} ${post.body} ${post.subreddit}`.toLowerCase();
    return MEME_INDICATORS.some((indicator) => text.includes(indicator));
}

/**
 * Check if post has enough signal (not just a title)
 */
function hasEnoughContent(post: RawPost): boolean {
    const totalLength = post.title.length + post.body.length;
    // Require at least 80 chars total, or if no body, title must be substantial
    if (totalLength < 80 && post.body.length < 20) {
        return false;
    }
    return true;
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

/**
 * Fetch top comments for a specific post
 * Used to find "deep pain" signals (e.g. "I tried this and it failed")
 */
async function fetchPostComments(postId: string): Promise<string[]> {
    const url = `https://www.reddit.com/comments/${postId}.json?sort=top&limit=10`;

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT }
        });

        if (!response.ok) return [];

        const data = await response.json();

        // Reddit returns array: [postListing, commentListing]
        if (!Array.isArray(data) || data.length < 2) return [];

        interface RedditComment {
            kind: string;
            data?: { body?: string };
        }
        const comments: RedditComment[] = data[1].data?.children || [];

        return comments
            .filter((c) => c.kind === "t1" && c.data?.body)
            .map((c) => c.data!.body!);

    } catch (error) {
        console.error(`Failed to fetch comments for ${postId}:`, error);
        return [];
    }
}

/**
 * Fetch posts from Reddit using intent-augmented queries
 * This dramatically improves signal quality
 */
export async function fetchRedditPosts(query: string): Promise<RawPost[]> {
    const allPosts: RawPost[] = [];
    const seenIds = new Set<string>();

    // Build intent-augmented queries
    // Build intent queries by replacing {K} with the query
    const queries = INTENT_QUERIES.map((template) =>
        template.replace("{K}", query)
    );

    // Fetch from a subset of intent queries to stay within rate limits
    // Use 6 most important queries
    const priorityQueries = queries.slice(0, 6);

    for (let i = 0; i < priorityQueries.length; i++) {
        const q = priorityQueries[i];

        // Add delay between requests (500ms)
        if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
        }

        const posts = await fetchRedditPage(q, "week");

        for (const post of posts) {
            if (!seenIds.has(post.id)) {
                seenIds.add(post.id);
                allPosts.push(post);
            }
        }
    }

    // Apply hard filters
    const filtered = allPosts.filter((post) => {
        // Filter out memes
        if (isMemePost(post)) return false;
        // Filter out low-content posts
        if (!hasEnoughContent(post)) return false;
        return true;
    });

    // Deduplicate
    const deduped = deduplicatePosts(filtered);

    // DEEP PAIN STEP: Enrich top posts with comments
    // Sort by engagement to pick the best candidates for comment scraping
    deduped.sort((a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2));

    // Take top 15 posts for deep analysis
    const deepScanParams = deduped.slice(0, 15);

    console.log(`Deep Scan: Fetching comments for top ${deepScanParams.length} posts...`);

    // Fetch comments in parallel (with small batching if needed, but 15 is mostly fine)
    await Promise.all(
        deepScanParams.map(async (post) => {
            if (post.comments > 0) {
                post.topComments = await fetchPostComments(post.id);
            }
        })
    );

    console.log(
        `Reddit: Fetched ${allPosts.length} raw → ${filtered.length} filtered → ${deduped.length} unique`
    );

    return deduped;
}

/**
 * Get subreddit breakdown from posts
 */
export function getSubredditBreakdown(
    posts: RawPost[]
): { subreddit: string; count: number }[] {
    const counts = new Map<string, number>();

    for (const post of posts) {
        if (post.subreddit) {
            counts.set(post.subreddit, (counts.get(post.subreddit) || 0) + 1);
        }
    }

    return Array.from(counts.entries())
        .map(([subreddit, count]) => ({ subreddit, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
}
