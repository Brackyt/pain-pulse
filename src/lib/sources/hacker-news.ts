import { RawPost } from "@/types/pulse";
import { registerSource, BreakdownItem, deduplicatePosts } from "./registry";

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
 */
export async function fetchHNPosts(query: string): Promise<{
    weekly: RawPost[];
    monthly: RawPost[];
}> {
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

    // Deduplicate using shared utility
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

/**
 * Fetch top comments for a specific HN story using Algolia API
 */
async function fetchHNComments(storyId: string): Promise<string[]> {
    const url = `https://hn.algolia.com/api/v1/search?tags=comment,story_${storyId}&hitsPerPage=10`;

    try {
        const response = await fetch(url);
        if (!response.ok) return [];

        const data = await response.json();

        interface HNComment {
            comment_text: string | null;
        }

        return (data.hits as HNComment[])
            .filter((hit) => hit.comment_text)
            .map((hit) => hit.comment_text as string);
    } catch (error) {
        console.error(`Failed to fetch HN comments for story ${storyId}:`, error);
        return [];
    }
}

/**
 * Wrapper to return flat array (HN has weekly/monthly structure)
 * Also enriches top posts with comments for deeper pain extraction
 */
async function fetchHNPostsFlat(query: string): Promise<RawPost[]> {
    const { monthly } = await fetchHNPosts(query);

    // Sort by engagement and take top 10 for deep scan
    const sorted = [...monthly].sort(
        (a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2)
    );
    const deepScanPosts = sorted.slice(0, 10);

    console.log(`HN: Fetching comments for top ${deepScanPosts.length} posts...`);

    await Promise.all(
        deepScanPosts.map(async (post) => {
            if (post.comments > 0) {
                post.topComments = await fetchHNComments(post.id);
            }
        })
    );

    return monthly;
}

// Self-register with the source registry
registerSource({
    id: "hackernews",
    name: "Hacker News",
    color: "text-orange-400",
    icon: {
        type: "text",
        content: "Y",
        className: "w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded",
    },
    fetch: fetchHNPostsFlat,
    getBreakdown: getHNBreakdown,
    breakdownTitle: "Top Discussions",
});
