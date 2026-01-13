import { RawPost } from "@/types/pulse";

/**
 * Gate 1: Global Spam Blacklist
 * Hard-drop posts containing these terms.
 */
const JUNK_BLACKLIST = [
    // Exam cheating / Academic dishonesty
    "pay someone", "take my", "write my", "exam help", "assignment help",
    "online class", "do my homework", "hesi", "proctored", "respondus",
    "lockdown browser", "cheat", "cheating",

    // Marketplace / Scams
    "escrow", "raffle", "spot", "shipping", "paypal g&s", "giveaway",
    "for sale", "selling", "wtb", "wts", "vendor",

    // Community noise
    "megathread", "daily thread", "weekly thread", "monthly thread",
    "automod", "automoderator", "remind me", "upvote", "karma",
    "discord server", "telegram group", "dm me", "inbox me",
    "hiring", "job offer", "salary", "interview", "resume", "cv review" // Added career noise
];

/**
 * TOOLS MODE: Anchors
 * Post must contain at least one of these to be considered "about a tool".
 */
const TOOL_ANCHORS = [
    "tool", "tools", "app", "apps", "software", "platform", "service",
    "solution", "dashboard", "api", "sdk", "library", "plugin", "extension",
    "self-hosted", "open source", "open-source", "saas", "startup",
    "alternative", "pricing", "cost", "vs", "comparison", "review",
    "integration", "stack", "tech stack"
];

/**
 * TOOLS MODE: High Intent Patterns
 * Generic signals that user is looking for or evaluating a solution.
 */
const HIGH_INTENT_PATTERNS = [
    /alternative\s+to/i,
    /looking\s+for/i,
    /recommend/i,
    /best\s+.*(tool|app|software|platform)/i,
    /too\s+expensive/i,
    /switch\s+from/i,
    /replace/i,
    /how\s+do\s+I/i,
    /anyone\s+using/i,
    /worth\s+it/i
];

/**
 * Check Keyword Dominance (Gate 2)
 * Returns true if query enters Title OR constitutes > 1.5% of body text
 */
function checkDominance(text: string, title: string, query: string): boolean {
    const queryLower = query.toLowerCase();

    // 1. Title Hit (High confidence)
    if (title.toLowerCase().includes(queryLower)) {
        return true;
    }

    // 2. Density Check
    const words = text.split(/\s+/);
    if (words.length < 10) return false;

    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return false;

    // Count occurrences of any significant query word
    let hits = 0;
    for (const word of words) {
        if (queryWords.some(qw => word.includes(qw))) {
            hits++;
        }
    }

    const density = hits / words.length;
    return density >= 0.015; // 1.5% density threshold
}

/**
 * Calculate relevance score using TOOLS MODE Logic
 *
 * Pipeline:
 * 1. Spam Check (Fail)
 * 2. Tool Anchor Check (Fail if no tool/intent signal)
 * 3. Keyword Dominance (Fail if incidental)
 * 4. Proximity Boost (Score)
 */
export function calculateRelevanceScore(
    post: RawPost,
    query: string
): number {
    const text = `${post.title} ${post.body}`.toLowerCase();

    // Gate 1: Spam Blacklist
    if (JUNK_BLACKLIST.some(word => text.includes(word))) {
        return 0;
    }

    // Gate 2: Tools Mode Anchor
    // Must match a Tool Anchor OR a High Intent Pattern
    const hasToolAnchor = TOOL_ANCHORS.some(a => text.includes(a));
    const hasIntentPattern = HIGH_INTENT_PATTERNS.some(p => p.test(text));

    if (!hasToolAnchor && !hasIntentPattern) {
        return 0; // Not about a tool/solution
    }

    // Gate 3: Keyword Dominance
    if (!checkDominance(text, post.title, query)) {
        return 0; // Not about the query topic
    }

    let score = 10; // Base score for passing generic tool gate

    // Bonus: Proximity of Intent
    // If exact query is near an intent trigger, boost score
    const queryLower = query.toLowerCase();
    if (post.title.toLowerCase().includes(queryLower)) {
        score += 5;
    }

    // Simple proximity boost if "alternative" or "recommend" is near query
    // This is less strict now because Gate 2 ensures we are in "Tools Land"
    if (text.match(new RegExp(`(alternative|recommend|best).{0,50}${queryLower}`, 'i'))) {
        score += 10;
    }

    return score;
}

/**
 * Filter posts by relevance score
 */
export function filterByRelevance(
    posts: RawPost[],
    query: string,
    minScore: number = 5
): RawPost[] {
    const scored = posts.map((post) => ({
        post,
        score: calculateRelevanceScore(post, query),
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
