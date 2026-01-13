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
];

/**
 * Gate 3 triggers: Intent Proximity
 * Post must have one of these near the keyword.
 */
const INTENT_TRIGGERS = [
    "alternative", "alternatives",
    "recommend", "recommendation", "recommendations",
    "tool", "tools", "app", "apps", "software",
    "pricing", "cost", "price", "expensive", "cheap", "free",
    "switch", "switching", "replace", "replacement",
    "how do you", "how to", "setup", "configure",
    "anyone using", "anyone use", "anyone have",
    "suggestions", "suggest",
    "vs", "versus", "compare", "comparison",
    "best", "top", "good",
    "looking for", "search for", "searching for",
    "problem", "issue", "doesn't work", "broken", "hate", "sucks"
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
    // Simple word count approximation
    const words = text.split(/\s+/);
    if (words.length < 10) return false; // Too short to be useful if not in title

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
 * Calculate relevance score using 3-Gate System
 * 
 * Returns score > 0 only if it passes all gates.
 */
export function calculateRelevanceScore(
    post: RawPost,
    query: string
): number {
    const text = `${post.title} ${post.body}`.toLowerCase();

    // Gate 1: Spam Blacklist
    if (JUNK_BLACKLIST.some(word => text.includes(word))) {
        return 0; // Immediate disqualification
    }

    // Gate 2: Keyword Dominance
    if (!checkDominance(text, post.title, query)) {
        return 0; // Not "about" the topic enough
    }

    let score = 5; // Base score for passing dominance

    // Gate 3: Intent Proximity
    // We boost highly if intent is found. 
    // If strict mode is needed, we could return 0 if no intent found,
    // but typically "Dominance + No Blacklist" is decent enough to keep 
    // for broader volume, while Proximity gives high score.

    const words = text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/);
    const triggerSet = new Set(INTENT_TRIGGERS);
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    // Find query indices
    const queryIndices: number[] = [];
    words.forEach((word, idx) => {
        if (queryWords.some(qw => word.includes(qw))) {
            queryIndices.push(idx);
        }
    });

    let hasProximity = false;
    const PROXIMITY_WINDOW = 15; // words

    for (const idx of queryIndices) {
        const start = Math.max(0, idx - PROXIMITY_WINDOW);
        const end = Math.min(words.length, idx + PROXIMITY_WINDOW);

        for (let i = start; i < end; i++) {
            if (triggerSet.has(words[i])) {
                score += 10;
                hasProximity = true;
                break;
            }
        }
        if (hasProximity) break;
    }

    // Optional: If we want to be STRICT about intent (Gate 3 as requirement)
    // Uncomment next line:
    if (!hasProximity) return 0;

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
