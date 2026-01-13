import { RawPost, PulseStats, PainSpike } from "@/types/pulse";
import { analyzePost } from "./signals";

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
 * Calculate Pain Index (0-100)
 * Uses weighted patterns with caps and sigmoid normalization
 */
export function calculatePainIndex(posts: RawPost[]): number {
    if (posts.length === 0) return 0;

    let totalPainScore = 0;
    let totalWeight = 0;

    for (const post of posts) {
        const { painScore } = analyzePost(post);
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
        const { painScore, buyerScore } = analyzePost(post);
        const weight = getPostWeight(post);

        // Cap scores at 8
        const cappedPain = Math.min(painScore, 8);
        const cappedIntent = Math.min(buyerScore, 8);

        // Apply sigmoid
        const painSig = sigmoid(cappedPain - 2);
        const intentSig = sigmoid(cappedIntent - 2);

        // Opportunity is the product of pain and intent
        const opportunity = painSig * intentSig;

        totalOpportunity += weight * opportunity;
        totalWeight += weight;

        if (buyerScore > 0) postsWithIntent++;
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

    const weeklyVolume = weeklyPosts.length;
    const monthlyVolume = monthlyPosts.length;

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
