import { RawPost } from "@/types/pulse";
import { registerSource, BreakdownItem, deduplicatePosts } from "./registry";

// Pain-focused intent queries for GitHub issues
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
        if (post.title.length < 15) return false;
        if (post.score === 0 && post.comments === 0) return false;
        return true;
    });

    // Deduplicate using shared utility
    const deduped = deduplicatePosts(filtered);

    console.log(`GitHub: Raw ${allPosts.length} → Filtered ${filtered.length} → Deduped ${deduped.length}`);

    // Deep scan: Enrich top 10 posts with comments
    const sorted = [...deduped].sort(
        (a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2)
    );
    const deepScanPosts = sorted.slice(0, 10);

    console.log(`GitHub: Fetching comments for top ${deepScanPosts.length} posts...`);

    await Promise.all(
        deepScanPosts.map(async (post) => {
            if (post.comments > 0) {
                post.topComments = await fetchGitHubComments(post.url);
            }
        })
    );

    return deduped;
}

/**
 * Fetch top comments for a GitHub issue
 * Parses the html_url to extract owner/repo/issue_number
 */
async function fetchGitHubComments(issueUrl: string): Promise<string[]> {
    // Parse URL like: https://github.com/owner/repo/issues/123
    const match = issueUrl.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
    if (!match) return [];

    const [, owner, repo, issueNumber] = match;
    const url = `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=5`;

    try {
        const response = await fetch(url, {
            headers: {
                "Accept": "application/vnd.github.v3+json",
                "User-Agent": "PainPulse/1.0",
            }
        });

        if (!response.ok) return [];

        interface GitHubComment {
            body: string;
        }

        const comments: GitHubComment[] = await response.json();
        return comments.map(c => c.body);
    } catch (error) {
        console.error(`Failed to fetch GitHub comments for ${issueUrl}:`, error);
        return [];
    }
}

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
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
            label: name,
            url: `https://github.com/${name}`,
            count
        }));
}

// Self-register with the source registry
registerSource({
    id: "github",
    name: "GitHub Issues",
    color: "text-gray-200",
    icon: {
        type: "svg",
        content: "M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z",
        className: "w-4 h-4 text-gray-100",
    },
    fetch: fetchGitHubPosts,
    getBreakdown: (posts) => getGitHubBreakdown(posts.filter(p => p.source === 'github')),
    breakdownTitle: "Top Repositories",
});
