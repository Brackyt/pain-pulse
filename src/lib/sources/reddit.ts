import { RawPost } from "@/types/pulse";

const USER_AGENT = "PainPulse/1.0 (Market Research Tool)";

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
    timeFilter: string,
    after?: string
): Promise<{ posts: RawPost[]; after: string | null }> {
    const encodedQuery = encodeURIComponent(query);
    let url = `https://www.reddit.com/search.json?q=${encodedQuery}&sort=relevance&t=${timeFilter}&limit=100`;

    if (after) {
        url += `&after=${after}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
            },
        });

        if (!response.ok) {
            console.error(`Reddit API error: ${response.status}`);
            return { posts: [], after: null };
        }

        const data: RedditSearchResponse = await response.json();

        const posts = data.data.children.map((post) => ({
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
        }));

        return { posts, after: data.data.after };
    } catch (error) {
        console.error("Failed to fetch Reddit page:", error);
        return { posts: [], after: null };
    }
}

/**
 * Fetch posts from Reddit search API with pagination
 * Fetches up to 300 posts across multiple time windows for better analysis
 */
export async function fetchRedditPosts(query: string): Promise<RawPost[]> {
    const allPosts: RawPost[] = [];
    const seenIds = new Set<string>();

    // Fetch from different time windows to get more diverse data
    const timeFilters = ["week", "month"];

    for (const timeFilter of timeFilters) {
        let after: string | undefined;
        let pages = 0;
        const maxPages = 1; // 1 page × 100 posts × 2 filters = ~150 unique

        while (pages < maxPages) {
            // Add delay between requests to avoid rate limiting
            if (pages > 0 || timeFilter !== "week") {
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            const result = await fetchRedditPage(query, timeFilter, after);

            for (const post of result.posts) {
                if (!seenIds.has(post.id)) {
                    seenIds.add(post.id);
                    allPosts.push(post);
                }
            }

            if (!result.after) break;
            after = result.after;
            pages++;
        }
    }

    console.log(`Reddit: Fetched ${allPosts.length} unique posts`);
    return allPosts;
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
