import { RawPost } from "@/types/pulse";

// Pain-focused intent queries for GitHub issues
// These target explicit frustration language in issue titles
const PAIN_INTENT_QUERIES = [
    "{K} bug",
    "{K} broken",
    "{K} not working",
    "{K} error",
    "{K} crash",
    "{K} issue",
    "{K} problem",
    "{K} fails",
];

interface GitHubUser {
    login: string;
}

interface GitHubIssue {
    id: number;
    title: string;
    body: string | null;
    html_url: string;
    state: string;
    created_at: string;
    comments: number;
    user: GitHubUser | null;
    reactions?: {
        total_count: number;
    };
    repository_url: string;
}

interface GitHubSearchResponse {
    total_count: number;
    incomplete_results: boolean;
    items: GitHubIssue[];
}

/**
 * Fetch a single GitHub search query
 */
async function fetchGitHubSearch(query: string): Promise<RawPost[]> {
    // GitHub search: require query in title, open issues only
    const q = `${query} in:title type:issue state:open`;
    const encodedQuery = encodeURIComponent(q);
    const url = `https://api.github.com/search/issues?q=${encodedQuery}&per_page=20`;

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "PainPulse/1.0",
            }
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.warn("GitHub rate limited");
                return [];
            }
            if (response.status === 422) {
                console.warn(`GitHub query validation failed for: ${query}`);
                return [];
            }
            console.error(`GitHub API error: ${response.status}`);
            return [];
        }

        const data: GitHubSearchResponse = await response.json();

        return data.items.map(issue => {
            // Extract repo name from repository_url
            // "https://api.github.com/repos/owner/repo"
            const repoName = issue.repository_url.split("/repos/")[1] || "unknown";

            return {
                id: `gh-${issue.id}`,
                title: issue.title,
                body: issue.body || "",
                url: issue.html_url,
                source: "github" as const,
                score: issue.reactions?.total_count || 0,
                comments: issue.comments,
                createdAt: new Date(issue.created_at),
                author: issue.user?.login || "unknown",
                subreddit: repoName, // Reuse subreddit field for repo name
            };
        });
    } catch (error) {
        console.error("Failed to fetch GitHub:", error);
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
 * Fetch GitHub issues using multiple pain-focused intent queries
 */
export async function fetchGitHubPosts(query: string): Promise<RawPost[]> {
    const allPosts: RawPost[] = [];
    const seenIds = new Set<string>();

    // Use top 4 intent queries to stay within rate limits
    const queries = PAIN_INTENT_QUERIES.slice(0, 4).map(template =>
        template.replace("{K}", query)
    );

    for (let i = 0; i < queries.length; i++) {
        const q = queries[i];

        // Delay between requests to respect rate limits
        if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        const posts = await fetchGitHubSearch(q);

        for (const post of posts) {
            if (!seenIds.has(post.id)) {
                seenIds.add(post.id);
                allPosts.push(post);
            }
        }
    }

    // Filter low-quality issues
    const filtered = allPosts.filter(post => {
        // Skip very short titles
        if (post.title.length < 15) return false;
        // Skip issues with no engagement
        if (post.score === 0 && post.comments === 0) return false;
        return true;
    });

    // Deduplicate
    const deduped = deduplicatePosts(filtered);

    console.log(`GitHub: Raw ${allPosts.length} → Filtered ${filtered.length} → Deduped ${deduped.length}`);

    return deduped;
}



/**
 * Get top repositories from the posts
 */
// Self-register with the source registry
import { registerSource, BreakdownItem } from "./registry";

/**
 * Get top repositories from the posts
 */
export function getGitHubBreakdown(posts: RawPost[]): BreakdownItem[] {
    const repoCounts = new Map<string, number>();

    posts.forEach(post => {
        if (post.source === 'github' && post.subreddit) {
            const repo = post.subreddit;
            repoCounts.set(repo, (repoCounts.get(repo) || 0) + 1);
        }
    });

    return Array.from(repoCounts.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by count descending
        .slice(0, 5)
        .map(([name, count]) => ({
            label: name,
            url: `https://github.com/${name}`,
            count
        }));
}

registerSource({
    id: "github",
    name: "GitHub Issues",
    color: "gray-100",
    icon: null,
    fetch: fetchGitHubPosts,
    getBreakdown: (posts) => getGitHubBreakdown(posts.filter(p => p.source === 'github')),
    breakdownTitle: "Top Repositories",
});
