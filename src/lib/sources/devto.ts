import { RawPost } from "@/types/pulse";

interface DevToArticle {
    id: number;
    title: string;
    description: string;
    url: string;
    published_at: string;
    positive_reactions_count: number;
    comments_count: number;
    user: {
        username: string;
    };
    tag_list: string[];
    reading_time_minutes: number;
}

/**
 * Fetch a single Dev.to search query
 * Uses `tag` parameter with comma-separated values
 */
async function fetchDevToSearch(tags: string[]): Promise<RawPost[]> {
    // Dev.to API: tags parameter accepts comma-separated single-word tags
    const sanitizedTags = tags
        .map(t => t.toLowerCase().replace(/[^a-z0-9]/g, ''))
        .filter(t => t.length > 2);

    if (sanitizedTags.length === 0) {
        return [];
    }

    const tagsParam = sanitizedTags.join(',');
    const url = `https://dev.to/api/articles?per_page=30&tag=${tagsParam}`;

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/json",
                "User-Agent": "PainPulse/1.0",
            }
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.warn("Dev.to rate limited");
                return [];
            }
            console.error(`Dev.to API error: ${response.status}`);
            return [];
        }

        const articles: DevToArticle[] = await response.json();

        console.log(`Dev.to: tag="${tagsParam}" returned ${articles.length} articles`);

        return articles.map(article => ({
            id: `devto-${article.id}`,
            title: article.title,
            body: article.description || "",
            url: article.url,
            source: "devto" as const,
            score: article.positive_reactions_count || 0,
            comments: article.comments_count || 0,
            createdAt: new Date(article.published_at),
            author: article.user.username,
            subreddit: article.tag_list[0] || "general", // Use first tag as "community"
        }));
    } catch (error) {
        console.error("Failed to fetch Dev.to:", error);
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
 * Fetch Dev.to articles using query words as tags
 */
export async function fetchDevToPosts(query: string): Promise<RawPost[]> {
    // Split query into words to use as tags
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    if (words.length === 0) {
        console.log("Dev.to: No valid tags to search");
        return [];
    }

    // Fetch with all words as comma-separated tags
    const allPosts = await fetchDevToSearch(words);

    // Also try just the first word to get broader results
    if (words.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
        const additionalPosts = await fetchDevToSearch([words[0]]);

        const seenIds = new Set(allPosts.map(p => p.id));
        for (const post of additionalPosts) {
            if (!seenIds.has(post.id)) {
                allPosts.push(post);
            }
        }
    }

    // Filter low-quality articles
    const filtered = allPosts.filter(post => {
        if (post.title.length < 15) return false;
        return true;
    });

    // Deduplicate
    const deduped = deduplicatePosts(filtered);

    console.log(`Dev.to: Raw ${allPosts.length} → Filtered ${filtered.length} → Deduped ${deduped.length}`);



    return deduped;
}

export interface DevToTagBreakdown {
    tag: string;
    url: string;
    count: number;
}

/**
 * Get top tags from the posts
 */
// Self-register with the source registry
import { registerSource, BreakdownItem } from "./registry";

/**
 * Get top tags from the posts
 */
export function getDevToBreakdown(posts: RawPost[]): BreakdownItem[] {
    const tagCounts = new Map<string, number>();

    posts.forEach(post => {
        if (post.source === 'devto' && post.subreddit) {
            const tag = post.subreddit;
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
    });

    return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .slice(0, 5)
        .map(([tag, count]) => ({
            label: `#${tag}`,
            url: `https://dev.to/t/${tag}`,
            count
        }));
}

registerSource({
    id: "devto",
    name: "Dev.to",
    color: "gray-100",
    icon: null,
    fetch: fetchDevToPosts,
    getBreakdown: (posts) => getDevToBreakdown(posts.filter(p => p.source === 'devto')),
    breakdownTitle: "Top Tags",
});
