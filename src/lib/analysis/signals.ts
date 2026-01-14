import { RawPost, TopPhrase } from "@/types/pulse";

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

// Triggers that explicitly signal PAIN, FRUSTRATION, or COST STRUGGLE
const PAIN_TRIGGERS = [
    "frustrating", "annoying", "painful", "headache", "nightmare", "fail", "failed",
    "hate", "sucks", "broken", "unreliable", "buggy", "slow", "hard to", "difficult",
    "confusing", "overkill", "too complex", "bloated",
    "too expensive", "insane pricing", "costly", "afford", "cheaper", "ripoff",
    "workaround", "manual", "spreadsheet", "excel", "hacky", "messy",
    "abandoned", "gave up", "stopped using", "switched from", "left",
    "stuck", "blocked", "limit", "limited", "restriction",
    "scam", "waste of time", "garbage", "trash",
    "nothing seems to", "don't understand why", "why is it so hard", "nothing fits"
];

// Triggers for specific CONSTRAINTS (context of struggle)
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
 * Extract "Pain Receipts" (formerly Best Quotes)
 * 
 * Rules:
 * 1. Must contain a PAIN TRIGGER.
 * 2. Length 10-40 words.
 * 3. Shows PROOF of struggle (not just a question).
 */
export function extractPainReceipts(
    posts: RawPost[],
    limit: number = 6
): string[] {
    const scoredQuotes: { text: string; score: number }[] = [];
    const uniqueTexts = new Set<string>();

    // Process top 30 posts (deep scan for pain)
    const topPosts = posts.slice(0, 30);

    for (const post of topPosts) {
        const sourcesToCheck: string[] = [];

        // 1. Post Body
        if (post.body) sourcesToCheck.push(post.body);

        // 2. Post Title
        sourcesToCheck.push(post.title);

        // 3. Top Comments (NEW: Deep Pain)
        if (post.topComments) {
            sourcesToCheck.push(...post.topComments);
        }

        // iterate all sources (body, title, comments)
        for (const sourceText of sourcesToCheck) {
            // Split into rough sentences
            const sentences = (sourceText || "")
                .split(/[.!?]+/)
                .map(s => cleanQuote(s))
                .filter(s => s.length > 5); // Ignore tiny fragments

            for (const sentence of sentences) {
                const sLower = sentence.toLowerCase();

                if (uniqueTexts.has(sLower)) continue;

                const words = sentence.split(" ");
                if (words.length < 8 || words.length > 45) continue;

                let score = 0;
                let hasPainTrigger = false;

                for (const trigger of PAIN_TRIGGERS) {
                    if (sLower.includes(trigger)) {
                        score += 10;
                        hasPainTrigger = true;
                        // Boost intense pain words
                        if (["hate", "nightmare", "failed", "expensive"].includes(trigger)) score += 5;
                    }
                }

                if (!hasPainTrigger) continue;

                // Boost if it sounds like a narrative "we tried..."
                if (sLower.includes("we tried") || sLower.includes("i tried") || sLower.includes("ended up")) {
                    score += 5;
                }

                // Boost constraints in longform too
                if (CONSTRAINT_TRIGGERS.some(t => sLower.includes(t))) {
                    score += 5;
                }

                scoredQuotes.push({ text: sentence, score });
                uniqueTexts.add(sLower);
            }
        }
    }

    return scoredQuotes
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(q => q.text);
}

/**
 * Extract "Top Frictions" (recurring pain themes)
 * Returns a list of SHORT pain/constraint statements.
 * Distinct from receipts: Focus is on "The Problem", not the "Story".
 * Ranked by Engagement (Post Score) + Match Quality.
 */
export function extractPainPoints(posts: RawPost[], limit: number = 5): string[] {
    const scoredFrictions: { text: string; score: number }[] = [];
    const uniqueTexts = new Set<string>();

    const topPosts = posts.slice(0, 50); // Scan deep

    for (const post of topPosts) {
        const sourcesToCheck: string[] = [];

        // 1. Post Body
        if (post.body) sourcesToCheck.push(post.body);

        // 2. Post Title
        sourcesToCheck.push(post.title);

        // 3. Top Comments (NEW)
        if (post.topComments) {
            sourcesToCheck.push(...post.topComments);
        }

        // Engagement Factor: Logarithmic boost based on post score
        // score 10 -> +1, score 100 -> +2, score 1000 -> +3
        const engagementBoost = Math.max(0, Math.log10(post.score || 1) * 2);

        for (const sourceText of sourcesToCheck) {
            const sentences = (sourceText || "")
                .split(/[.!?]+/)
                .map(s => cleanQuote(s))
                .filter(s => s.length > 5);

            for (const sentence of sentences) {
                const sLower = sentence.toLowerCase();

                // Dedupe fuzzy matches (contains)
                if ([...uniqueTexts].some(ut => ut.includes(sLower) || sLower.includes(ut))) continue;

                const words = sentence.split(" ");
                // Frictions should be punchy: 5-25 words
                if (words.length < 5 || words.length > 25) continue;

                let score = 0;
                let hasSignal = false;

                // Constraint Check (Primary Signal for Frictions)
                if (CONSTRAINT_TRIGGERS.some(t => sLower.includes(t))) {
                    score += 10;
                    hasSignal = true;
                }

                // Pain Trigger Check (Secondary but required if no constraint)
                if (PAIN_TRIGGERS.some(t => sLower.includes(t))) {
                    score += hasSignal ? 5 : 8; // Boost existing or base score
                    hasSignal = true;
                }

                if (!hasSignal) continue;

                // Narrative Boost (we tried, ended up)
                if (sLower.includes("we tried") || sLower.includes("ended up")) score += 5;

                // Apply Engagement Boost to the final score
                score += engagementBoost;

                scoredFrictions.push({ text: sentence, score });
                uniqueTexts.add(sLower);
            }
        }
    }

    return scoredFrictions
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(q => q.text);
}


