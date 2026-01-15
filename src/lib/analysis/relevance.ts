import { RawPost } from "@/types/pulse";
import {
    batchCalculateRelevance,
    SEMANTIC_CONFIG,
} from "./embeddings";

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
    "hiring", "job offer", "salary", "interview", "resume", "cv review"
];

/**
 * Check if a post matches the spam blacklist
 */
function isSpam(post: RawPost): boolean {
    const text = `${post.title} ${post.body}`.toLowerCase();
    return JUNK_BLACKLIST.some(word => text.includes(word));
}

/**
 * Filter posts by semantic relevance (async version using embeddings)
 * 
 * Pipeline:
 * 1. Spam Blacklist Filter (fast, synchronous)
 * 2. Semantic Similarity Filter (uses NLP embeddings)
 */
export async function filterByRelevanceAsync(
    posts: RawPost[],
    query: string,
    threshold: number = SEMANTIC_CONFIG.SIMILARITY_THRESHOLD
): Promise<RawPost[]> {
    // Gate 1: Remove spam (fast pre-filter)
    const nonSpamPosts = posts.filter(post => !isSpam(post));

    if (nonSpamPosts.length === 0) {
        console.log(`Relevance filter: ${posts.length} posts → 0 (all spam)`);
        return [];
    }

    console.log(`Pre-filter: ${posts.length} posts → ${nonSpamPosts.length} non-spam`);

    // Gate 2: Semantic similarity filter
    const relevanceMap = await batchCalculateRelevance(query, nonSpamPosts);

    const scored = nonSpamPosts.map(post => ({
        post,
        similarity: relevanceMap.get(post.id) || 0,
    }));

    const filtered = scored
        .filter(item => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .map(item => item.post);

    console.log(
        `Semantic filter: ${nonSpamPosts.length} posts → ${filtered.length} relevant (threshold: ${threshold.toFixed(2)})`
    );

    return filtered;
}

// ============================================
// Legacy synchronous functions (for backward compatibility)
// These can be removed once all callers are updated
// ============================================

/**
 * @deprecated Use filterByRelevanceAsync instead
 * Synchronous relevance check (keyword-based fallback)
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

    // Simple keyword presence check (legacy behavior)
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    let score = 0;

    // Title match is strong signal
    if (post.title.toLowerCase().includes(queryLower)) {
        score += 15;
    } else if (queryWords.some(w => post.title.toLowerCase().includes(w))) {
        score += 10;
    }

    // Body match
    if (queryWords.some(w => text.includes(w))) {
        score += 5;
    }

    return score;
}

/**
 * @deprecated Use filterByRelevanceAsync instead
 * Synchronous filter (keyword-based fallback)
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
        `Relevance filter (legacy): ${posts.length} posts → ${filtered.length} relevant (min score: ${minScore})`
    );

    return filtered;
}
