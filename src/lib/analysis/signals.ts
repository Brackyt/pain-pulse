import { RawPost } from "@/types/pulse";

/**
 * Universal intent triggers used for quote linking
 */
const INTENT_TRIGGERS = [
    "alternative", "recommend", "tool", "app", "switch", "replace",
    "pricing", "cost", "expensive", "cheap", "free",
    "how do", "how to", "setup", "help", "suggestion",
    "best", "worst", "hate", "love", "problem", "issue", "doesn't work"
];

const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "can", "this", "that", "these", "those",
    "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her",
    "its", "our", "their", "what", "which", "who", "when", "where", "why",
    "how", "all", "each", "every", "both", "few", "more", "most", "other",
    "some", "such", "no", "not", "only", "own", "same", "so", "than", "too",
    "very", "just", "also", "now", "here", "there", "then", "if", "any",
    "about", "into", "through", "during", "before", "after", "up", "down",
    "out", "off", "over", "under", "again", "further", "once", "like", "using",
    "use", "used", "get", "got", "getting", "one", "two", "new", "first",
    "really", "need", "want", "think", "know", "see", "end", "top", "try",
    "http", "https", "www", "com", "org", "net", "io", "reddit", "comments",
    "deleted", "removed", "amp", "nbsp", "quot", "etc", "something", "anything",
    "question", "help", "update", "please", "thanks", "guys", "anyone"
]);

/**
 * Clean text for n-gram extraction
 */
function cleanText(text: string): string[] {
    return text.toLowerCase()
        .replace(/https?:\/\/\S+/g, "") // remove URLs
        .replace(/[^a-z0-9\s]/g, " ")   // remove punctuation
        .split(/\s+/)
        .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Extract top phrases using N-Grams (3-6 words)
 * Scored by frequency * engagement
 */
export function extractTopPhrases(
    posts: RawPost[],
    limit: number = 20 // Return more, let UI truncate
): { phrase: string; count: number }[] {
    const phraseScores = new Map<string, number>();
    const phraseCounts = new Map<string, number>();

    for (const post of posts) {
        const text = `${post.title} ${post.body}`;
        const words = cleanText(text);
        const engagement = Math.log(1 + post.score + post.comments);

        // Extract 3, 4, 5, 6-grams
        for (let n = 3; n <= 6; n++) {
            for (let i = 0; i < words.length - n + 1; i++) {
                const phrase = words.slice(i, i + n).join(" ");

                // Score = 1 (base) + engagement boost
                const score = 1 + (engagement * 0.5);

                phraseScores.set(phrase, (phraseScores.get(phrase) || 0) + score);
                phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
            }
        }
    }

    // Filter and sort
    return Array.from(phraseScores.entries())
        .filter(([phrase, score]) => {
            const count = phraseCounts.get(phrase) || 0;
            // Require at least 2 occurrences unless score is very high
            return count >= 2;
        })
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([phrase]) => ({
            phrase,
            count: phraseCounts.get(phrase) || 0
        }));
}

/**
 * Guaranteed Best Quotes Extraction
 * Picks best sentences from top posts, handling fallbacks robustly.
 */
export function extractBestQuotes(
    posts: RawPost[],
    query: string,
    limit: number = 5
): string[] {
    const quotes: string[] = [];
    const usedTexts = new Set<string>();

    // Take top 20 posts by score
    const topPosts = [...posts]
        .sort((a, b) => (b.score + b.comments) - (a.score + a.comments))
        .slice(0, 20);

    const queryLower = query.toLowerCase();

    for (const post of topPosts) {
        if (quotes.length >= limit) break;

        const text = post.body || post.title;
        // Split into sentences (simple split by punctuation)
        const sentences = text.split(/[.!?\n]+/);

        // Find best sentence
        let bestSentence = "";
        let bestScore = -1;

        for (const s of sentences) {
            const sLower = s.toLowerCase().trim();
            if (sLower.length < 20 || sLower.length > 200) continue;

            let score = 0;

            // Contains query?
            if (sLower.includes(queryLower)) score += 5;

            // Contains intent trigger?
            if (INTENT_TRIGGERS.some(t => sLower.includes(t))) score += 3;

            if (score > bestScore) {
                bestScore = score;
                bestSentence = s.trim();
            }
        }

        // If found a good sentence, use it
        if (bestScore > 0 && !usedTexts.has(bestSentence)) {
            quotes.push(bestSentence);
            usedTexts.add(bestSentence);
        } else if (post.title.length > 20 && !usedTexts.has(post.title)) {
            // Fallback to title if no good sentence found
            quotes.push(post.title);
            usedTexts.add(post.title);
        }
    }

    return quotes;
}
