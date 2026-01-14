import { RawPost } from "@/types/pulse";
import { registerSource, BreakdownItem, deduplicatePosts } from "./registry";

const USER_AGENT = "PainPulse/1.0 (Market Research Tool)";

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
    if (totalLength < 80 && post.body.length < 20) {
        return false;
    }
    return true;
}

/**
 * Fetch top comments for a specific post
 */
async function fetchPostComments(postId: string): Promise<string[]> {
    const url = `https://www.reddit.com/comments/${postId}.json?sort=top&limit=10`;

    try {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT }
        });

        if (!response.ok) return [];

        const data = await response.json();

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
 */
export async function fetchRedditPosts(query: string): Promise<RawPost[]> {
    const allPosts: RawPost[] = [];
    const seenIds = new Set<string>();

    // Build intent queries by replacing {K} with the query
    const queries = INTENT_QUERIES.map((template) =>
        template.replace("{K}", query)
    );

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
        if (isMemePost(post)) return false;
        if (!hasEnoughContent(post)) return false;
        return true;
    });

    // Deduplicate using shared utility
    const deduped = deduplicatePosts(filtered);

    // DEEP PAIN STEP: Enrich top posts with comments
    deduped.sort((a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2));

    // Take top 15 posts for deep analysis
    const deepScanParams = deduped.slice(0, 15);

    console.log(`Deep Scan: Fetching comments for top ${deepScanParams.length} posts...`);

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
export function getSubredditBreakdown(posts: RawPost[]): BreakdownItem[] {
    const counts = new Map<string, number>();

    for (const post of posts) {
        if (post.subreddit) {
            counts.set(post.subreddit, (counts.get(post.subreddit) || 0) + 1);
        }
    }

    return Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([subreddit, count]) => ({
            label: `r/${subreddit}`,
            url: `https://reddit.com/r/${subreddit}`,
            count
        }));
}

// Self-register with the source registry
registerSource({
    id: "reddit",
    name: "Reddit",
    color: "text-orange-400",
    icon: {
        type: "svg",
        content: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z",
        className: "w-4 h-4 text-orange-500",
    },
    fetch: fetchRedditPosts,
    getBreakdown: (posts) => getSubredditBreakdown(posts.filter(p => p.source === 'reddit')),
    breakdownTitle: "Top Subreddits",
});
