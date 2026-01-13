import { RawPost } from "@/types/pulse";

// Pain signal keywords and their weights
export const PAIN_SIGNALS: Record<string, number> = {
    hate: 3,
    hating: 3,
    annoying: 2,
    annoyed: 2,
    broken: 3,
    issue: 1.5,
    issues: 1.5,
    problem: 1.5,
    problems: 1.5,
    frustrated: 3,
    frustrating: 2.5,
    frustration: 2.5,
    "can't": 2,
    cant: 2,
    cannot: 2,
    scam: 3,
    terrible: 2.5,
    worst: 2.5,
    awful: 2.5,
    sucks: 2,
    suck: 2,
    useless: 2.5,
    waste: 2,
    disappointed: 2,
    disappointing: 2,
    bug: 1.5,
    bugs: 1.5,
    buggy: 2,
    crash: 2,
    crashes: 2,
    crashing: 2,
    slow: 1.5,
    expensive: 2,
    overpriced: 2.5,
    confusing: 2,
    complicated: 1.5,
    difficult: 1.5,
    impossible: 2.5,
    nightmare: 3,
    horrible: 2.5,
    struggling: 2,
    struggle: 2,
    stuck: 1.5,
    fail: 2,
    failed: 2,
    failing: 2,
    unreliable: 2.5,
    unusable: 3,
    "doesn't work": 3,
    "won't work": 3,
    "stopped working": 3,
};

// Buyer intent signal keywords and their weights
export const BUYER_SIGNALS: Record<string, number> = {
    "alternative to": 4,
    "alternatives to": 4,
    alternatives: 3,
    alternative: 3,
    "looking for": 3,
    "searching for": 3,
    recommend: 2.5,
    recommendation: 2.5,
    recommendations: 2.5,
    suggestions: 2,
    suggest: 2,
    "what tool": 3,
    "which tool": 3,
    "best app": 3,
    "best tool": 3,
    "best software": 3,
    "good app": 2.5,
    "good tool": 2.5,
    pricing: 2,
    "how much": 2,
    "free version": 2,
    "free alternative": 3,
    "open source": 2,
    "self hosted": 2.5,
    "self-hosted": 2.5,
    "switch from": 3,
    "switching from": 3,
    "migrate from": 3,
    "migrating from": 3,
    replace: 2.5,
    replacement: 2.5,
    "instead of": 2.5,
    "better than": 3,
    "compared to": 2,
    comparison: 2,
    vs: 1.5,
    versus: 1.5,
    "anyone using": 2.5,
    "anyone use": 2.5,
    "anyone know": 2,
    "does anyone": 2,
    "is there a": 2.5,
    "are there any": 2.5,
};

export interface SignalMatch {
    signal: string;
    weight: number;
    context: string;
}

/**
 * Detect pain signals in text
 */
export function detectPainSignals(text: string): SignalMatch[] {
    const lowerText = text.toLowerCase();
    const matches: SignalMatch[] = [];

    // Sort signals by length (longest first) to match longer phrases first
    const sortedSignals = Object.entries(PAIN_SIGNALS).sort(
        (a, b) => b[0].length - a[0].length
    );

    for (const [signal, weight] of sortedSignals) {
        if (lowerText.includes(signal)) {
            // Extract context around the match
            const index = lowerText.indexOf(signal);
            const start = Math.max(0, index - 40);
            const end = Math.min(text.length, index + signal.length + 40);
            const context = text.slice(start, end).trim();

            matches.push({ signal, weight, context });
        }
    }

    return matches;
}

/**
 * Detect buyer intent signals in text
 */
export function detectBuyerSignals(text: string): SignalMatch[] {
    const lowerText = text.toLowerCase();
    const matches: SignalMatch[] = [];

    // Sort signals by length (longest first)
    const sortedSignals = Object.entries(BUYER_SIGNALS).sort(
        (a, b) => b[0].length - a[0].length
    );

    for (const [signal, weight] of sortedSignals) {
        if (lowerText.includes(signal)) {
            const index = lowerText.indexOf(signal);
            const start = Math.max(0, index - 40);
            const end = Math.min(text.length, index + signal.length + 40);
            const context = text.slice(start, end).trim();

            matches.push({ signal, weight, context });
        }
    }

    return matches;
}

/**
 * Analyze a single post for signals
 */
export function analyzePost(post: RawPost): {
    painScore: number;
    buyerScore: number;
    painMatches: SignalMatch[];
    buyerMatches: SignalMatch[];
} {
    const fullText = `${post.title} ${post.body}`;
    const painMatches = detectPainSignals(fullText);
    const buyerMatches = detectBuyerSignals(fullText);

    const painScore = painMatches.reduce((sum, m) => sum + m.weight, 0);
    const buyerScore = buyerMatches.reduce((sum, m) => sum + m.weight, 0);

    return { painScore, buyerScore, painMatches, buyerMatches };
}

/**
 * Extract top phrases using n-gram approach with pain/intent context
 * This aggregates actual repeating patterns instead of unique regex matches
 */
export function extractTopPhrases(
    posts: RawPost[],
    limit: number = 10
): { phrase: string; count: number }[] {
    const phraseCounts = new Map<string, number>();

    // Pain/intent trigger words - phrases must start with or contain these
    const triggerPatterns = [
        "alternative to", "alternatives to",
        "looking for", "searching for",
        "recommend", "recommendation",
        "anyone using", "anyone use", "anyone tried",
        "is there a", "are there any",
        "problem with", "issue with", "issues with",
        "hate", "frustrated", "frustrating",
        "too expensive", "overpriced",
        "doesn't work", "broken", "useless",
        "why is", "why does", "why can't",
        "can't figure out", "struggling with",
        "switched from", "switching to", "migrating from",
    ];

    for (const post of posts) {
        const fullText = `${post.title} ${post.body}`.toLowerCase();

        // Check for each trigger pattern
        for (const trigger of triggerPatterns) {
            if (fullText.includes(trigger)) {
                // Find the context around the trigger (up to 8 words total)
                const idx = fullText.indexOf(trigger);
                const start = Math.max(0, idx);
                const end = Math.min(fullText.length, idx + 60);
                let context = fullText.slice(start, end);

                // Clean up: take words up to punctuation or newline
                context = context
                    .replace(/[.!?\n]/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .split(" ")
                    .slice(0, 8)
                    .join(" ");

                if (context.length >= 10 && context.length <= 80) {
                    // Normalize: just the trigger + first few followup words
                    const words = context.split(" ");
                    const triggerWords = trigger.split(" ").length;
                    const phrase = words.slice(0, triggerWords + 2).join(" ");

                    if (phrase.length >= 8) {
                        phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
                    }
                }
            }
        }
    }

    // Filter to phrases with count >= 2, sort by count
    return Array.from(phraseCounts.entries())
        .filter(([_, count]) => count >= 2)
        .map(([phrase, count]) => ({ phrase, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}
