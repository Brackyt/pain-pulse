import { RawPost } from "@/types/pulse";

/**
 * Category-specific expansion dictionaries for relevance scoring
 * Each category has: expansions (boost relevance) and exclusions (kill relevance)
 */
const CATEGORY_EXPANSIONS: Record<string, { expansions: string[]; exclusions: string[] }> = {
    // Default expansions based on common pain/intent patterns
    default: {
        expansions: [],
        exclusions: [
            // Spam patterns
            "raffle", "escrow", "spot", "giveaway", "PSA", "megathread",
            "daily thread", "weekly thread", "monthly thread",
            // Bot/automation spam
            "automod", "automoderator", "bot", "remind me",
            // Unrelated noise
            "meme", "shitpost", "circlejerk", "karma farm",
        ],
    },
    
    // Note-taking / productivity
    "note": {
        expansions: [
            "note taking", "note-taking", "notetaking", "notes app",
            "onenote", "goodnotes", "obsidian", "notion", "evernote",
            "apple notes", "markdown notes", "second brain", "zettelkasten",
            "roam research", "logseq", "bear app", "joplin", "simplenote",
            "org-mode", "pkm", "personal knowledge",
        ],
        exclusions: ["raffle", "escrow", "spot", "giveaway", "PSA"],
    },
    
    // Project management
    "project": {
        expansions: [
            "project management", "task management", "kanban", "gantt",
            "jira", "asana", "monday.com", "clickup", "trello", "basecamp",
            "linear", "height", "shortcut", "teamwork", "wrike",
            "scrum", "agile", "sprint planning", "backlog",
        ],
        exclusions: ["raffle", "escrow", "spot", "giveaway"],
    },
    
    // Email / automation
    "email": {
        expansions: [
            "email automation", "email marketing", "newsletter",
            "mailchimp", "convertkit", "beehiiv", "substack", "buttondown",
            "smtp", "transactional email", "cold email", "email outreach",
            "sendgrid", "postmark", "mailgun", "resend",
        ],
        exclusions: ["raffle", "escrow", "giveaway"],
    },
    
    // Analytics / tracking
    "analytics": {
        expansions: [
            "web analytics", "product analytics", "google analytics", "ga4",
            "plausible", "fathom", "umami", "mixpanel", "amplitude", "posthog",
            "heap", "segment", "tracking", "events", "funnels", "attribution",
            "user behavior", "session recording", "heatmap",
        ],
        exclusions: ["mba", "iim", "admission", "course", "degree", "raffle"],
    },
    
    // Password / security
    "password": {
        expansions: [
            "password manager", "1password", "bitwarden", "lastpass",
            "dashlane", "keepass", "nordpass", "proton pass",
            "passkey", "2fa", "mfa", "authenticator",
        ],
        exclusions: ["raffle", "escrow", "giveaway"],
    },
    
    // Time tracking
    "time": {
        expansions: [
            "time tracking", "time tracker", "toggl", "clockify", "harvest",
            "timesheet", "pomodoro", "rescuetime", "timely",
            "billable hours", "freelancer time",
        ],
        exclusions: ["raffle", "escrow", "giveaway"],
    },
};

/**
 * Find the best matching category for a query
 */
function findCategory(query: string): { expansions: string[]; exclusions: string[] } {
    const lowerQuery = query.toLowerCase();
    
    for (const [key, value] of Object.entries(CATEGORY_EXPANSIONS)) {
        if (key !== "default" && lowerQuery.includes(key)) {
            return {
                expansions: [...value.expansions, ...CATEGORY_EXPANSIONS.default.expansions],
                exclusions: [...value.exclusions, ...CATEGORY_EXPANSIONS.default.exclusions],
            };
        }
    }
    
    // Also check if query itself matches any expansion terms
    for (const [key, value] of Object.entries(CATEGORY_EXPANSIONS)) {
        if (key === "default") continue;
        for (const exp of value.expansions) {
            if (lowerQuery.includes(exp) || exp.includes(lowerQuery)) {
                return {
                    expansions: [...value.expansions],
                    exclusions: [...value.exclusions, ...CATEGORY_EXPANSIONS.default.exclusions],
                };
            }
        }
    }
    
    return CATEGORY_EXPANSIONS.default;
}

/**
 * Calculate relevance score for a post
 * Returns 0 if post should be dropped, positive score if relevant
 */
export function calculateRelevanceScore(
    post: RawPost,
    query: string,
    expansions: string[],
    exclusions: string[]
): number {
    const text = `${post.title} ${post.body}`.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 2);
    
    // Check exclusions first - if any match, return 0
    for (const exc of exclusions) {
        if (text.includes(exc.toLowerCase())) {
            return 0;
        }
    }
    
    let score = 0;
    
    // Exact query match: +5
    if (text.includes(queryLower)) {
        score += 5;
    }
    
    // Query word matches: +1 each
    for (const word of queryWords) {
        if (text.includes(word)) {
            score += 1;
        }
    }
    
    // Expansion matches: +3 for phrase, +1 for partial
    for (const exp of expansions) {
        const expLower = exp.toLowerCase();
        if (text.includes(expLower)) {
            score += expLower.includes(" ") ? 3 : 1;
        }
    }
    
    // Title match bonus: title is more relevant than body
    const titleLower = post.title.toLowerCase();
    if (titleLower.includes(queryLower)) {
        score += 3;
    }
    for (const word of queryWords) {
        if (titleLower.includes(word)) {
            score += 1;
        }
    }
    
    return score;
}

/**
 * Filter posts by relevance score
 */
export function filterByRelevance(
    posts: RawPost[],
    query: string,
    minScore: number = 3
): RawPost[] {
    const category = findCategory(query);
    
    const scored = posts.map((post) => ({
        post,
        score: calculateRelevanceScore(post, query, category.expansions, category.exclusions),
    }));
    
    const filtered = scored
        .filter((item) => item.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.post);
    
    console.log(
        `Relevance filter: ${posts.length} posts → ${filtered.length} relevant (min score: ${minScore})`
    );
    
    return filtered;
}

/**
 * Get expansion dictionary for a query (for external use)
 */
export function getQueryExpansions(query: string): { expansions: string[]; exclusions: string[] } {
    return findCategory(query);
}
