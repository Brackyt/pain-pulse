import { RawPost } from "@/types/pulse";

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
 * Fetch a single page of HN results
 */
async function fetchHNPage(query: string, page: number): Promise<RawPost[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&hitsPerPage=100&page=${page}`;

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
        console.error("Failed to fetch HN page:", error);
        return [];
    }
}

/**
 * Fetch posts from Hacker News Algolia API with pagination
 * Fetches up to 300 posts
 */
export async function fetchHNPosts(query: string): Promise<RawPost[]> {
    const allPosts: RawPost[] = [];
    const maxPages = 2; // 2 pages × ~75 posts = ~150

    for (let page = 0; page < maxPages; page++) {
        if (page > 0) {
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        const posts = await fetchHNPage(query, page);
        allPosts.push(...posts);

        if (posts.length < 100) break; // No more pages
    }

    console.log(`HN: Fetched ${allPosts.length} posts`);
    return allPosts;
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
