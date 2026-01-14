import { RawPost } from "@/types/pulse";
import { registerSource, BreakdownItem, deduplicatePosts } from "./registry";

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
 */
async function fetchDevToSearch(tags: string[]): Promise<RawPost[]> {
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
 * Fetch Dev.to articles using query words as tags
 */
export async function fetchDevToPosts(query: string): Promise<RawPost[]> {
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

    // Deduplicate using shared utility
    const deduped = deduplicatePosts(filtered);

    console.log(`Dev.to: Raw ${allPosts.length} → Filtered ${filtered.length} → Deduped ${deduped.length}`);

    return deduped;
}

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
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({
            label: `#${tag}`,
            url: `https://dev.to/t/${tag}`,
            count
        }));
}

// Self-register with the source registry
registerSource({
    id: "devto",
    name: "Dev.to",
    color: "text-gray-200",
    icon: {
        type: "svg",
        content: "M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .65-.08.84-.23.18-.16.27-.48.27-.97v-1.92c0-.49-.09-.82-.27-.98zm-3.5 0c-.18-.16-.46-.23-.84-.23H2.5v4.36h.58c.37 0 .65-.08.84-.23.18-.16.27-.48.27-.97v-1.92c0-.49-.09-.82-.27-.98zM24 2.5v19c0 1.38-1.12 2.5-2.5 2.5h-19C1.12 24 0 22.88 0 21.5v-19C0 1.12 1.12 0 2.5 0h19C22.88 0 24 1.12 24 2.5zM8.56 15.8c.48-.55.72-1.37.72-2.45v-2.5c0-1.04-.24-1.83-.72-2.38-.48-.54-1.16-.81-2.04-.81H4.28v11.45h2.24c.88 0 1.56-.27 2.04-.81zm6.42-6.24c0-.58-.36-1.02-.86-1.02H11.8v8.08h2.26c.52 0 .86-.37.86-.88v-3.06h-1.68v-.96h1.68V9.56h.06zm7.5-.56h-1.14c-.57 0-1.04.2-1.39.58-.18.2-.31.44-.39.72-.08.28-.12.69-.12 1.22v1.2c0 1.44.52 2.42 1.56 2.94l-.04.02c.24.1.49.15.76.15h1.04v-.86h-.72c-.52 0-.84-.08-1-.25-.16-.16-.24-.45-.24-.86v-1.8h2.24V9.9h-2.24v-1.1h-1.08v1.1h-1.08v.86h1.08v2.76c0 .63.18 1.12.54 1.47.36.35.88.53 1.56.53h2.08v-6.1h-1.42v-.06z",
        className: "w-4 h-4 text-gray-100",
    },
    fetch: fetchDevToPosts,
    getBreakdown: (posts) => getDevToBreakdown(posts.filter(p => p.source === 'devto')),
    breakdownTitle: "Top Tags",
});
