import { RawPost } from "@/types/pulse";
import { registerSource, BreakdownItem, deduplicatePosts } from "./registry";

interface SerperOrganicResult {
    title: string;
    link: string;
    snippet: string;
    position: number;
    date?: string;
}

interface SerperResponse {
    organic: SerperOrganicResult[];
    searchParameters: {
        q: string;
    };
}

/**
 * Fetch Google search results via Serper.dev API
 */
async function fetchSerperSearch(query: string): Promise<RawPost[]> {
    const apiKey = process.env.SERPER_API_KEY;

    if (!apiKey) {
        console.warn("Serper: SERPER_API_KEY not set, skipping SERP source");
        return [];
    }

    const url = "https://google.serper.dev/search";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "X-API-KEY": apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                q: query,
                num: 30, // Number of results
            }),
        });

        if (!response.ok) {
            if (response.status === 401) {
                console.error("Serper: Invalid API key");
                return [];
            }
            if (response.status === 429) {
                console.warn("Serper: Rate limited or credits exhausted");
                return [];
            }
            console.error(`Serper API error: ${response.status}`);
            return [];
        }

        const data: SerperResponse = await response.json();

        console.log(`Serper: query="${query}" returned ${data.organic?.length || 0} results`);

        if (!data.organic || data.organic.length === 0) {
            return [];
        }

        return data.organic.map((result, index) => ({
            id: `serper-${encodeURIComponent(query)}-${index}`,
            title: result.title,
            body: result.snippet || "",
            url: result.link,
            source: "serper" as const,
            // Position-based "score" - higher ranked = higher score
            score: Math.max(30 - result.position, 1),
            comments: 0, // SERP doesn't have comments
            createdAt: result.date ? new Date(result.date) : new Date(),
            subreddit: extractDomain(result.link), // Use domain as "community"
        }));
    } catch (error) {
        console.error("Failed to fetch Serper:", error);
        return [];
    }
}

/**
 * Extract domain from URL for breakdown
 */
function extractDomain(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        // Remove www. prefix
        return hostname.replace(/^www\./, "");
    } catch {
        return "unknown";
    }
}

/**
 * Fetch SERP results with intent-based queries
 */
export async function fetchSerperPosts(query: string): Promise<RawPost[]> {
    const intentQueries = [
        `${query} problem`,
        `${query} issue`,
        `${query} alternative`,
        `"${query}" frustrating`,
    ];

    const allPosts: RawPost[] = [];
    const seenUrls = new Set<string>();

    // First, search the base query
    const basePosts = await fetchSerperSearch(query);
    for (const post of basePosts) {
        if (!seenUrls.has(post.url)) {
            seenUrls.add(post.url);
            allPosts.push(post);
        }
    }

    // Then try intent queries with rate limiting
    for (let i = 0; i < Math.min(intentQueries.length, 2); i++) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit

        const posts = await fetchSerperSearch(intentQueries[i]);
        for (const post of posts) {
            if (!seenUrls.has(post.url)) {
                seenUrls.add(post.url);
                allPosts.push(post);
            }
        }
    }

    // Filter and deduplicate
    const filtered = allPosts.filter(post => {
        // Filter out very short titles
        if (post.title.length < 15) return false;
        return true;
    });

    const deduped = deduplicatePosts(filtered);

    console.log(`Serper: Raw ${allPosts.length} → Filtered ${filtered.length} → Deduped ${deduped.length}`);

    return deduped;
}

/**
 * Get top domains breakdown from SERP results
 */
export function getSerperBreakdown(posts: RawPost[]): BreakdownItem[] {
    const domainCounts = new Map<string, number>();

    posts.forEach(post => {
        if (post.source === "serper" && post.subreddit) {
            const domain = post.subreddit;
            domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
        }
    });

    return Array.from(domainCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([domain, count]) => ({
            label: domain,
            url: `https://${domain}`,
            count,
        }));
}

// Self-register with the source registry
registerSource({
    id: "serper",
    name: "Google SERP",
    color: "text-blue-400",
    icon: {
        type: "svg",
        // Google "G" logo simplified
        content: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
        className: "w-4 h-4 text-blue-400",
    },
    fetch: fetchSerperPosts,
    getBreakdown: (posts) => getSerperBreakdown(posts.filter(p => p.source === "serper")),
    breakdownTitle: "Top Domains",
});
