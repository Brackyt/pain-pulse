import { RawPost, PulseStats, PainSpike } from "@/types/pulse";
import { analyzePost } from "./signals";

/**
 * Calculate Pain Index (0-100)
 * Based on weighted pain signals + engagement across all posts
 */
export function calculatePainIndex(posts: RawPost[]): number {
    if (posts.length === 0) return 0;

    let postsWithPain = 0;
    let totalWeightedPain = 0;

    for (const post of posts) {
        const { painScore } = analyzePost(post);

        if (painScore > 0) {
            postsWithPain++;
            // Weight by engagement (log scale to prevent outliers)
            const engagement = Math.log10(Math.max(1, post.score + post.comments * 2));
            totalWeightedPain += painScore * (1 + engagement * 0.2);
        }
    }

    if (postsWithPain === 0) return 0;

    // Pain density: what % of posts have pain signals
    const painDensity = (postsWithPain / posts.length) * 100;

    // Average pain intensity per painful post
    const avgPainIntensity = totalWeightedPain / postsWithPain;

    // Combine: 60% density, 40% intensity, normalized
    const rawScore = (painDensity * 0.6) + (Math.min(avgPainIntensity, 20) * 2);

    return Math.min(100, Math.round(rawScore));
}

/**
 * Calculate Opportunity Score (0-100)
 * High score = lots of pain + buyer intent + growing trend
 */
export function calculateOpportunityScore(
    posts: RawPost[],
    painIndex: number
): number {
    if (posts.length === 0) return 0;

    let postsWithBuyerIntent = 0;
    let totalBuyerWeight = 0;

    for (const post of posts) {
        const { buyerScore } = analyzePost(post);

        if (buyerScore > 0) {
            postsWithBuyerIntent++;
            totalBuyerWeight += buyerScore;
        }
    }

    // Buyer intent density
    const buyerDensity = (postsWithBuyerIntent / posts.length) * 100;

    // Trend velocity: recent posts vs older
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentPosts = posts.filter((p) => p.createdAt.getTime() > weekAgo);
    const recentRatio = posts.length > 0 ? (recentPosts.length / posts.length) : 0;
    const trendBonus = recentRatio > 0.3 ? 15 : recentRatio > 0.15 ? 8 : 0;

    // Combine factors
    // - Pain is essential (40%)
    // - Buyer intent is key (35%)  
    // - Trend momentum (15%)
    // - Volume bonus if > 100 posts (10%)
    const volumeBonus = posts.length > 200 ? 10 : posts.length > 100 ? 5 : 0;

    const rawScore =
        (painIndex * 0.4) +
        (buyerDensity * 0.35) +
        trendBonus +
        volumeBonus;

    return Math.min(100, Math.round(rawScore));
}

/**
 * Calculate pain spikes (actual date-based comparison)
 */
export function calculatePainSpikes(posts: RawPost[]): PainSpike {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    const weeklyPosts = posts.filter((p) => p.createdAt.getTime() > weekAgo);
    const monthlyPosts = posts.filter((p) => p.createdAt.getTime() > monthAgo);

    const weeklyVolume = weeklyPosts.length;
    const monthlyVolume = monthlyPosts.length;

    // Calculate week-over-week change
    // Compare this week's pace to average weekly pace over the month
    const prevWeeksAvg = monthlyVolume > weeklyVolume
        ? (monthlyVolume - weeklyVolume) / 3 // Remaining 3 weeks average
        : monthlyVolume / 4;

    let deltaPercent = 0;
    if (prevWeeksAvg > 0) {
        deltaPercent = Math.round(((weeklyVolume - prevWeeksAvg) / prevWeeksAvg) * 100);
    } else if (weeklyVolume > 0) {
        deltaPercent = 100; // All activity is new
    }

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
