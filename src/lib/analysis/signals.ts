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
 * Extract actual pain phrases and buyer intent questions from posts
 * These are real quotes that show the pain
 */
export function extractTopPhrases(
    posts: RawPost[],
    limit: number = 10
): { phrase: string; count: number }[] {
    const phraseCounts = new Map<string, number>();

    for (const post of posts) {
        const fullText = `${post.title} ${post.body}`;

        // Extract actual complaints and questions
        const patterns = [
            // Buyer intent patterns
            /(?:any|best|good)\s+alternative(?:s)?\s+to\s+[\w\s]+(?:\?|\.|\!|$)/gi,
            /looking\s+for\s+(?:a|an)?\s*[\w\s]{3,30}(?:that|which|to)/gi,
            /is\s+there\s+(?:a|an)\s+[\w\s]{3,40}\?/gi,
            /what(?:'s| is)\s+(?:a\s+)?(?:good|best|better)\s+[\w\s]{3,30}\?/gi,
            /recommend(?:ations?)?\s+for\s+[\w\s]{3,30}/gi,
            /anyone\s+(?:know|using|use|tried)\s+[\w\s]{3,30}\?/gi,

            // Pain patterns
            /(?:i\s+)?hate\s+(?:how|when|that)?\s*[\w\s]{3,40}/gi,
            /(?:so\s+)?frustrated\s+with\s+[\w\s]{3,30}/gi,
            /problem\s+with\s+[\w\s]{3,30}/gi,
            /issue(?:s)?\s+with\s+[\w\s]{3,30}/gi,
            /(?:why\s+(?:is|does|do)|can(?:'t|not))\s+[\w\s]{3,40}\??/gi,
            /[\w\s]{3,20}\s+(?:is\s+)?(?:broken|useless|terrible|awful|garbage)/gi,
            /struggling\s+(?:to|with)\s+[\w\s]{3,30}/gi,
        ];

        for (const pattern of patterns) {
            const matches = fullText.match(pattern);
            if (matches) {
                for (const match of matches) {
                    // Clean up the match
                    const cleaned = match
                        .trim()
                        .replace(/\s+/g, " ")
                        .slice(0, 100);

                    if (cleaned.length >= 15 && cleaned.length <= 100) {
                        const normalized = cleaned.toLowerCase();
                        phraseCounts.set(normalized, (phraseCounts.get(normalized) || 0) + 1);
                    }
                }
            }
        }
    }

    return Array.from(phraseCounts.entries())
        .map(([phrase, count]) => ({ phrase, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}
