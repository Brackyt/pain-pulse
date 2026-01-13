import { RawPost, Theme, SourceLink } from "@/types/pulse";
import { analyzePost, PAIN_SIGNALS, BUYER_SIGNALS } from "./signals";

// Common stop words to filter out
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
    "about", "into", "through", "during", "before", "after", "above", "below",
    "up", "down", "out", "off", "over", "under", "again", "further", "once",
    "http", "https", "www", "com", "org", "net", "im", "ive", "dont", "doesnt",
    "cant", "wont", "shouldnt", "wouldnt", "couldnt", "didnt", "isnt", "wasnt",
    "arent", "werent", "hasnt", "havent", "hadnt", "get", "got", "getting",
    "like", "really", "need", "want", "think", "know", "using", "use", "used",
    "one", "two", "new", "first", "last", "long", "great", "little", "own",
    "see", "time", "way", "make", "made", "thing", "things", "much", "even",
    "something", "anything", "nothing", "everything", "someone", "anyone",
    "good", "bad", "best", "better", "right", "back", "still", "well", "many",
    "say", "said", "says", "take", "come", "came", "goes", "going", "being",
    "people", "work", "works", "working", "day", "days", "year", "years",
]);

// Words that indicate a pain point when combined
const PAIN_CONTEXT_WORDS = new Set([
    ...Object.keys(PAIN_SIGNALS),
    "help", "issue", "problem", "error", "fail", "failed", "failing",
    "wrong", "bad", "worse", "worst", "hard", "difficult", "struggle",
    "pain", "painful", "headache", "nightmare", "horror", "terrible",
    "suck", "sucks", "awful", "horrible", "useless", "worthless",
]);

// Words that indicate buyer intent
const BUYER_CONTEXT_WORDS = new Set([
    "alternative", "alternatives", "recommend", "recommendation", "suggest",
    "looking", "searching", "need", "want", "best", "better", "switch",
    "replace", "replacement", "instead", "compare", "comparison", "vs",
    "free", "cheap", "affordable", "pricing", "price", "cost", "pay",
    "tool", "app", "software", "service", "platform", "solution",
]);

interface ThemeCandidate {
    phrase: string;
    posts: RawPost[];
    painScore: number;
    buyerScore: number;
}

/**
 * Extract meaningful n-grams (2-3 word phrases) from text
 */
function extractNGrams(text: string): string[] {
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2);

    const ngrams: string[] = [];

    // Bigrams (2 words)
    for (let i = 0; i < words.length - 1; i++) {
        const w1 = words[i];
        const w2 = words[i + 1];

        // Skip if both are stop words
        if (STOP_WORDS.has(w1) && STOP_WORDS.has(w2)) continue;

        // At least one word should be meaningful
        const hasPainContext = PAIN_CONTEXT_WORDS.has(w1) || PAIN_CONTEXT_WORDS.has(w2);
        const hasBuyerContext = BUYER_CONTEXT_WORDS.has(w1) || BUYER_CONTEXT_WORDS.has(w2);
        const hasNonStop = !STOP_WORDS.has(w1) || !STOP_WORDS.has(w2);

        if ((hasPainContext || hasBuyerContext) && hasNonStop) {
            ngrams.push(`${w1} ${w2}`);
        }
    }

    // Trigrams (3 words) - for patterns like "alternative to X"
    for (let i = 0; i < words.length - 2; i++) {
        const w1 = words[i];
        const w2 = words[i + 1];
        const w3 = words[i + 2];

        // Look for specific patterns
        if (w1 === "alternative" && w2 === "to" && !STOP_WORDS.has(w3)) {
            ngrams.push(`alternative to ${w3}`);
        }
        if (w1 === "looking" && w2 === "for" && !STOP_WORDS.has(w3)) {
            ngrams.push(`looking for ${w3}`);
        }
        if (w1 === "problem" && w2 === "with" && !STOP_WORDS.has(w3)) {
            ngrams.push(`problem with ${w3}`);
        }
        if (w1 === "issue" && w2 === "with" && !STOP_WORDS.has(w3)) {
            ngrams.push(`issue with ${w3}`);
        }
        if (w1 === "hate" && !STOP_WORDS.has(w2)) {
            ngrams.push(`hate ${w2}`);
        }
        if (w1 === "frustrated" && w2 === "with" && !STOP_WORDS.has(w3)) {
            ngrams.push(`frustrated with ${w3}`);
        }
    }

    return ngrams;
}

/**
 * Cluster posts into meaningful themes based on n-gram analysis
 */
export function clusterThemes(posts: RawPost[], maxThemes: number = 5): Theme[] {
    if (posts.length === 0) return [];

    // Only analyze posts with pain or buyer signals
    const relevantPosts = posts.filter((post) => {
        const { painScore, buyerScore } = analyzePost(post);
        return painScore > 0 || buyerScore > 0;
    });

    if (relevantPosts.length === 0) return [];

    // Extract n-grams and track which posts they appear in
    const phraseMap = new Map<string, { posts: Set<RawPost>; painSum: number; buyerSum: number }>();

    for (const post of relevantPosts) {
        const fullText = `${post.title} ${post.body}`;
        const ngrams = extractNGrams(fullText);
        const { painScore, buyerScore } = analyzePost(post);

        for (const ngram of ngrams) {
            if (!phraseMap.has(ngram)) {
                phraseMap.set(ngram, { posts: new Set(), painSum: 0, buyerSum: 0 });
            }
            const entry = phraseMap.get(ngram)!;
            entry.posts.add(post);
            entry.painSum += painScore;
            entry.buyerSum += buyerScore;
        }
    }

    // Convert to candidates and filter
    const candidates: ThemeCandidate[] = [];

    for (const [phrase, data] of phraseMap) {
        // Require at least 3 posts to be meaningful
        if (data.posts.size < 3) continue;

        candidates.push({
            phrase,
            posts: Array.from(data.posts),
            painScore: data.painSum,
            buyerScore: data.buyerSum,
        });
    }

    // Sort by number of posts × (pain + buyer scores)
    candidates.sort((a, b) => {
        const scoreA = a.posts.length * (a.painScore + a.buyerScore);
        const scoreB = b.posts.length * (b.painScore + b.buyerScore);
        return scoreB - scoreA;
    });

    // Build themes, avoiding post overlap
    const usedPosts = new Set<string>();
    const themes: Theme[] = [];

    for (const candidate of candidates) {
        if (themes.length >= maxThemes) break;

        // Filter to only unused posts
        const unusedPosts = candidate.posts.filter((p) => !usedPosts.has(p.id));
        if (unusedPosts.length < 2) continue;

        // Mark posts as used
        for (const post of unusedPosts) {
            usedPosts.add(post.id);
        }

        // Calculate share
        const share = Math.round((unusedPosts.length / posts.length) * 100);

        // Extract best quotes (prioritize ones with the phrase)
        const quotePosts = unusedPosts.sort((a, b) => (b.score + b.comments) - (a.score + a.comments));
        const quotes = quotePosts
            .slice(0, 5)
            .map((p) => {
                // Prefer title if it's descriptive, otherwise use body
                const text = p.title.length > 30 ? p.title : (p.body || p.title);
                return text.length > 200 ? text.slice(0, 200) + "..." : text;
            })
            .filter((q) => q.length > 20);

        // Build source links
        const sources: SourceLink[] = quotePosts.slice(0, 3).map((p) => ({
            title: p.title.slice(0, 60) + (p.title.length > 60 ? "..." : ""),
            url: p.url,
            source: p.source,
        }));

        // Format the theme title nicely
        const title = candidate.phrase
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

        themes.push({
            title,
            share,
            quotes: quotes.slice(0, 3),
            sources,
        });
    }

    return themes;
}
