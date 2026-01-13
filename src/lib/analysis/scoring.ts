import { RawPost, PulseStats, PainSpike } from "@/types/pulse";

// Simple keyword lists for scoring
const PAIN_KEYWORDS = [
    "hate", "annoying", "broken", "issue", "problem", "frustrated", "sucks",
    "terrible", "worst", "awful", "useless", "waste", "disappointed", "bug",
    "slow", "expensive", "hard", "difficult", "nightmare", "fail", "doesn't work"
];

const INTENT_KEYWORDS = [
    "alternative", "recommend", "suggestion", "looking for", "switch", "replace",
    "pricing", "cost", "buy", "purchase", "subscription", "tool", "app", "help"
];

/**
 * Calculate robust engagement score with log scaling
 * engagement = log(1 + upvotes) + 0.8*log(1 + comments)
 */
function getEngagementScore(post: RawPost): number {
    return Math.log(1 + post.score) + 0.8 * Math.log(1 + post.comments);
}

/**
 * Calculate recency boost (exponential decay)
 * recency = exp(-hours_since_post / 72)
 */
function getRecencyBoost(post: RawPost): number {
    const hoursSincePost = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
    return Math.exp(-hoursSincePost / 72);
}

/**
 * Calculate post weight: engagement * (0.6 + 0.4*recency)
 */
function getPostWeight(post: RawPost): number {
    const engagement = getEngagementScore(post);
    const recency = getRecencyBoost(post);
    return engagement * (0.6 + 0.4 * recency);
}

/**
 * Sigmoid function for capping scores
 */
function sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
}

/**
 * Analyze a single post for pain/intent scores locally
 */
function scorePost(post: RawPost): { painScore: number; intentScore: number } {
    const text = `${post.title} ${post.body}`.toLowerCase();

    let painScore = 0;
    let intentScore = 0;

    // Simple keyword counting
    for (const word of PAIN_KEYWORDS) {
        if (text.includes(word)) painScore += 2;
    }

    for (const word of INTENT_KEYWORDS) {
        if (text.includes(word)) intentScore += 2;
    }

    return { painScore, intentScore };
}

/**
 * Calculate Pain Index (0-100)
 * Uses weighted patterns with caps and sigmoid normalization
 */
export function calculatePainIndex(posts: RawPost[]): number {
    if (posts.length === 0) return 0;

    let totalPainScore = 0;
    let totalWeight = 0;

    for (const post of posts) {
        const { painScore } = scorePost(post);
        const weight = getPostWeight(post);

        // Cap pain score at 8, then apply sigmoid
        const cappedPain = Math.min(painScore, 8);
        const normalizedPain = sigmoid(cappedPain - 2); // Shift so 2+ pain = >0.5

        totalPainScore += weight * normalizedPain;
        totalWeight += weight;
    }

    if (totalWeight === 0) return 0;

    // Average weighted pain, scale to 0-100
    const avgPain = totalPainScore / totalWeight;
    return Math.min(100, Math.round(avgPain * 100));
}

/**
 * Calculate Opportunity Score (0-100)
 * opportunity = weight * sigmoid(pain) * sigmoid(intent)
 */
export function calculateOpportunityScore(
    posts: RawPost[],
    painIndex: number
): number {
    if (posts.length === 0) return 0;

    let totalOpportunity = 0;
    let totalWeight = 0;
    let postsWithIntent = 0;

    for (const post of posts) {
        const { painScore, intentScore } = scorePost(post);
        const weight = getPostWeight(post);

        // Cap scores at 8
        const cappedPain = Math.min(painScore, 8);
        const cappedIntent = Math.min(intentScore, 8);

        // Apply sigmoid
        const painSig = sigmoid(cappedPain - 2);
        const intentSig = sigmoid(cappedIntent - 2);

        // Opportunity is the product of pain and intent
        const opportunity = painSig * intentSig;

        totalOpportunity += weight * opportunity;
        totalWeight += weight;

        if (intentScore > 0) postsWithIntent++;
    }

    if (totalWeight === 0) return 0;

    // Factor in the density of buyer intent posts
    const intentDensity = postsWithIntent / posts.length;

    // Combine weighted opportunity with intent density
    const avgOpportunity = totalOpportunity / totalWeight;
    const rawScore = (avgOpportunity * 70) + (intentDensity * 30);

    return Math.min(100, Math.round(rawScore));
}

/**
 * Calculate pain spikes with proper baseline comparison
 * spike = (count_7d + 1) / (count_30d/4 + 1)
 */
export function calculatePainSpikes(posts: RawPost[]): PainSpike {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const weeklyPosts = posts.filter((p) => p.createdAt.getTime() > weekAgo);
    const monthlyPosts = posts.filter((p) => p.createdAt.getTime() > monthAgo);

    return calculatePainSpikesFromCounts(weeklyPosts.length, monthlyPosts.length);
}

/**
 * Calculate pain spikes from pre-computed counts
 * Use this when weekly and monthly counts come from separate API calls
 */
export function calculatePainSpikesFromCounts(
    weeklyVolume: number,
    monthlyVolume: number
): PainSpike {
    // Proper spike calculation:
    // spike = (count_7d + 1) / (count_30d/4 + 1)
    const weeklyCount = weeklyVolume + 1;
    const monthlyAvgPerWeek = monthlyVolume / 4 + 1;
    const spikeRatio = weeklyCount / monthlyAvgPerWeek;
    const deltaPercent = Math.round((spikeRatio - 1) * 100);

    return {
        weeklyVolume,
        monthlyVolume,
        deltaPercent,
    };
}

/**
 * Calculate all stats for a set of posts
 */
export function calculateStats(posts: RawPost[]): PulseStats {
    const painIndex = calculatePainIndex(posts);
    const opportunityScore = calculateOpportunityScore(posts, painIndex);
    const volume = posts.length;

    return {
        painIndex,
        opportunityScore,
        volume,
    };
}
