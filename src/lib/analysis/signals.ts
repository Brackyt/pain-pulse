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
    "integration", "stack", "tech", "data", "analytics"
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

// Intent triggers for high-signal quotes
const QUOTE_TRIGGERS = [
    "alternative", "recommend", "switch", "replace",
    "pricing", "cost", "expensive", "cheaper",
    "love", "hate", "problem", "issue", "bug", "broken",
    "how do i", "how to", "setup", "configure",
    "best", "worst", "avoid", "worth it", "scam"
];

function cleanQuote(text: string): string {
    return text
        .replace(/\s+/g, " ")
        .replace(/^["']|["']$/g, "") // Remove surrounding quotes
        .trim();
}

/**
 * Extract "Receipt" Quotes
 * 
 * Rules:
 * 1. Must come from the provided posts.
 * 2. Must contain an INTENT TRIGGER.
 * 3. Length must be 10-35 words (tweet sized, not a novel).
 * 4. Fallback: Use post title if no perfect sentence found.
 */
export function extractBestQuotes(
    posts: RawPost[],
    limit: number = 6
): string[] {
    const scoredQuotes: { text: string; score: number }[] = [];
    const uniqueTexts = new Set<string>();

    // Process top 20 posts only (highest signal)
    const topPosts = posts.slice(0, 20);

    for (const post of topPosts) {
        // Split into rough sentences
        const sentences = (post.body || "")
            .split(/[.!?]+/)
            .map(s => cleanQuote(s))
            .filter(s => s.length > 5); // Ignore tiny fragments

        // Also evaluate title
        sentences.push(cleanQuote(post.title));

        for (const sentence of sentences) {
            if (uniqueTexts.has(sentence)) continue;

            const words = sentence.split(" ");

            // Length Gate (8-40 words)
            // Titles might be shorter, that's okay if they are high intent
            if (words.length < 8 || words.length > 40) continue;

            let score = 0;

            // Trigger Check
            let hasTrigger = false;
            for (const trigger of QUOTE_TRIGGERS) {
                if (sentence.toLowerCase().includes(trigger)) {
                    score += 10;
                    hasTrigger = true;
                    // Boost specific strong triggers
                    if (["alternative", "pricing", "problem"].includes(trigger)) score += 5;
                }
            }

            if (!hasTrigger) continue; // Strict Requirement

            // Boost if it comes from title
            if (sentence === cleanQuote(post.title)) {
                score += 5;
            }

            scoredQuotes.push({ text: sentence, score });
            uniqueTexts.add(sentence);
        }
    }

    // Sort by score and take top N
    return scoredQuotes
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(q => q.text);
}
