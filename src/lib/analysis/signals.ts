import { RawPost, TopPhrase } from "@/types/pulse";
import { batchScorePain, PAIN_CONFIG } from "./embeddings";

// Stop words to filter out common noise
const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
    "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "can", "could", "will", "would", "should", "may", "might",
    "must", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her",
    "its", "our", "their", "this", "that", "these", "those", "from", "up", "down",
    "out", "about", "into", "over", "after", "some", "any", "no", "not", "only",
    "own", "other", "so", "than", "too", "very", "just", "if", "when", "where", "why",
    "how", "all", "what", "more", "most", "who", "which", "there", "here", "as",
    "video", "image", "media", "http", "https", "www", "com", "reddit", "comments",
    "removed", "deleted", "amp", "xb", "gt", "lt"
]);

// Words that significantly anchor a phrase to the domain (must contain at least one)
const DOMAIN_NOUNS = [
    "tool", "tools", "app", "apps", "software", "platform", "service",
    "solution", "system", "dashboard", "api", "sdk", "library",
    "alternative", "alternatives", "pricing", "cost", "review",
    "problem", "issue", "error", "bug", "guide", "tutorial", "setup",
    "integration", "stack", "tech", "data", "analytics",
    "fail", "broke", "slow", "stupid", "hate", "nightmare", "sucks"
];

/**
 * Extract generic top phrases (2-6 word n-grams) from a set of posts.
 * Scored by frequency * engagement.
 * 
 * Rules:
 * 1. Must contain a DOMAIN NOUN (e.g. "tool", "app", "pricing").
 * 2. Deduplicates singular/plural forms ("analytics tool" == "analytics tools").
 */
export function extractTopPhrases(posts: RawPost[], limit: number = 20): TopPhrase[] {
    const phraseMap = new Map<string, { count: number; original: string }>();
    const allText = posts.map(p => `${p.title} ${p.body}`).join(" ").toLowerCase();

    // Clean text: remove special chars, keep alphanumeric and spaces
    const cleanText = allText.replace(/[^a-z0-9\s]/g, " ");
    const words = cleanText.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

    // Generate n-grams (2 to 5 words - reduced max length slightly)
    const MAX_N = 5;
    const MIN_N = 2; // Allow 2 words if they are strong

    for (let i = 0; i < words.length; i++) {
        for (let n = MIN_N; n <= MAX_N; n++) {
            if (i + n > words.length) break;

            const phraseTokens = words.slice(i, i + n);
            const phrase = phraseTokens.join(" ");

            // Validation 1: alphanumeric check
            if (/^\d|\d$/.test(phrase)) continue;

            // Validation 2: Domain Noun Gate
            // Must contain at least one domain-anchoring noun
            // This kills "formatting png auto"
            if (!phraseTokens.some(t => DOMAIN_NOUNS.some(noun => t.includes(noun)))) {
                continue;
            }

            // Deduplication Key: Normalize plurals
            // "analytics tools" -> "analytics tool"
            // Simple heuristic: remove trailing 's' from words > 3 chars
            const dedupKey = phraseTokens.map(t =>
                (t.length > 3 && t.endsWith('s')) ? t.slice(0, -1) : t
            ).join(" ");

            const existing = phraseMap.get(dedupKey) || { count: 0, original: phrase };
            existing.count++;

            // Update original to the most frequent variation (simple swap if we see this one)
            // Or just keep the first one. Let's keep the one that matches dedup key if possible?
            // Actually, usually plural is fine. We just want to count them together.
            if (phrase.length < existing.original.length) existing.original = phrase; // Prefer shorter/singular specific for display? 

            phraseMap.set(dedupKey, existing);
        }
    }

    // Convert to array and filter
    const phrases = Array.from(phraseMap.values())
        .map(data => ({
            phrase: data.original,
            count: data.count
        }))
        .filter(p => p.count > 1) // Must appear at least twice
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

    return phrases;
}

// Triggers for specific CONSTRAINTS (context of struggle)
// These are kept as keyword boosts since they're very specific
const CONSTRAINT_TRIGGERS = [
    "for agencies", "small team", "at scale", "limitations", "for non-tech",
    "clunky", "bloat", "learning curve", "too many features", "not enough features",
    "enterprise", "startup", "freelancer", "budget"
];

function cleanQuote(text: string): string {
    return text
        .replace(/\s+/g, " ")
        .replace(/^["']|["']$/g, "") // Remove surrounding quotes
        .trim();
}

/**
 * Extract all candidate sentences from posts
 */
function extractSentences(posts: RawPost[], minWords: number, maxWords: number): { text: string; engagementBoost: number }[] {
    const sentences: { text: string; engagementBoost: number }[] = [];
    const uniqueTexts = new Set<string>();

    for (const post of posts) {
        const sourcesToCheck: string[] = [];

        if (post.body) sourcesToCheck.push(post.body);
        sourcesToCheck.push(post.title);
        if (post.topComments) sourcesToCheck.push(...post.topComments);

        // Engagement boost based on post score
        const engagementBoost = Math.max(0, Math.log10(post.score || 1) * 2);

        for (const sourceText of sourcesToCheck) {
            const rawSentences = (sourceText || "")
                .split(/[.!?]+/)
                .map(s => cleanQuote(s))
                .filter(s => s.length > 5);

            for (const sentence of rawSentences) {
                const sLower = sentence.toLowerCase();
                if (uniqueTexts.has(sLower)) continue;

                const words = sentence.split(" ");
                if (words.length < minWords || words.length > maxWords) continue;

                sentences.push({ text: sentence, engagementBoost });
                uniqueTexts.add(sLower);
            }
        }
    }

    return sentences;
}

/**
 * Extract "Pain Receipts" using SEMANTIC pain detection
 * 
 * A sentence is a "pain receipt" if:
 * 1. Semantically similar to pain archetypes (scored by embedding similarity)
 * 2. Length 8-45 words (shows proof/narrative of struggle)
 */
export async function extractPainReceipts(
    posts: RawPost[],
    limit: number = 6
): Promise<string[]> {
    // Process top 30 posts for deep pain extraction
    const topPosts = posts.slice(0, 30);

    // Extract all candidate sentences (8-45 words for receipts - longer narratives)
    const candidates = extractSentences(topPosts, 8, 45);

    if (candidates.length === 0) return [];

    // Batch score all sentences for pain using semantic similarity
    const painScores = await batchScorePain(candidates.map(c => c.text));

    // Score and rank
    const scored = candidates
        .map(c => {
            const painScore = painScores.get(c.text) || 0;

            // Skip if not painful enough
            if (painScore < PAIN_CONFIG.PAIN_THRESHOLD) {
                return null;
            }

            let score = painScore * 20; // Base score from pain similarity

            // Boost for strong pain
            if (painScore >= PAIN_CONFIG.STRONG_PAIN_THRESHOLD) {
                score += 5;
            }

            // Boost narratives ("we tried", "ended up")
            const sLower = c.text.toLowerCase();
            if (sLower.includes("we tried") || sLower.includes("i tried") || sLower.includes("ended up")) {
                score += 3;
            }

            // Boost constraints
            if (CONSTRAINT_TRIGGERS.some(t => sLower.includes(t))) {
                score += 2;
            }

            return { text: c.text, score };
        })
        .filter((item): item is { text: string; score: number } => item !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.text);

    return scored;
}

/**
 * Extract "Top Frictions" using SEMANTIC pain detection
 * Short punchy pain statements (5-25 words)
 * Ranked by engagement + pain intensity
 */
export async function extractPainPoints(
    posts: RawPost[],
    limit: number = 5
): Promise<string[]> {
    // Scan top 50 posts
    const topPosts = posts.slice(0, 50);

    // Extract candidate sentences (5-25 words for frictions - shorter/punchier)
    const candidates = extractSentences(topPosts, 5, 25);

    if (candidates.length === 0) return [];

    // Batch score for pain
    const painScores = await batchScorePain(candidates.map(c => c.text));

    // Score and rank
    const scored = candidates
        .map(c => {
            const painScore = painScores.get(c.text) || 0;

            // Skip if not painful enough
            if (painScore < PAIN_CONFIG.PAIN_THRESHOLD) {
                return null;
            }

            let score = painScore * 15; // Base score from pain

            // Add engagement boost
            score += c.engagementBoost;

            // Boost for strong pain
            if (painScore >= PAIN_CONFIG.STRONG_PAIN_THRESHOLD) {
                score += 5;
            }

            // Boost constraints (primary signal for frictions)
            const sLower = c.text.toLowerCase();
            if (CONSTRAINT_TRIGGERS.some(t => sLower.includes(t))) {
                score += 3;
            }

            return { text: c.text, score };
        })
        .filter((item): item is { text: string; score: number } => item !== null)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.text);

    return scored;
}
