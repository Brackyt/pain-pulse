import { RawPost } from "@/types/pulse";
import { getEmbeddings, cosineSimilarity } from "./embeddings";

/**
 * Configuration for clustering
 */
export const CLUSTERING_CONFIG = {
    // Number of theme clusters to generate
    NUM_CLUSTERS: 4,
    // Max iterations for k-means convergence
    MAX_ITERATIONS: 20,
    // Convergence threshold (if centroids move less than this, stop)
    CONVERGENCE_THRESHOLD: 0.001,
};

/**
 * K-means clustering implementation
 * Returns array of cluster assignments (index for each post)
 */
function kMeans(
    embeddings: number[][],
    k: number,
    maxIterations: number = CLUSTERING_CONFIG.MAX_ITERATIONS
): number[] {
    const n = embeddings.length;
    if (n === 0) return [];
    if (n <= k) {
        // If fewer points than clusters, each point is its own cluster
        return embeddings.map((_, i) => i);
    }

    const dim = embeddings[0].length;

    // Initialize centroids using k-means++ style initialization
    const centroids: number[][] = [];
    const usedIndices = new Set<number>();

    // Pick first centroid randomly
    const firstIdx = Math.floor(Math.random() * n);
    centroids.push([...embeddings[firstIdx]]);
    usedIndices.add(firstIdx);

    // Pick remaining centroids with probability proportional to distance squared
    for (let c = 1; c < k; c++) {
        let maxDist = -1;
        let bestIdx = 0;

        for (let i = 0; i < n; i++) {
            if (usedIndices.has(i)) continue;

            // Find min distance to existing centroids
            let minDist = Infinity;
            for (const centroid of centroids) {
                const dist = 1 - cosineSimilarity(embeddings[i], centroid);
                if (dist < minDist) minDist = dist;
            }

            if (minDist > maxDist) {
                maxDist = minDist;
                bestIdx = i;
            }
        }

        centroids.push([...embeddings[bestIdx]]);
        usedIndices.add(bestIdx);
    }

    // Cluster assignments
    let assignments = new Array(n).fill(0);

    for (let iter = 0; iter < maxIterations; iter++) {
        // Assignment step: assign each point to nearest centroid
        const newAssignments = embeddings.map(emb => {
            let bestCluster = 0;
            let bestSim = -Infinity;

            for (let c = 0; c < k; c++) {
                const sim = cosineSimilarity(emb, centroids[c]);
                if (sim > bestSim) {
                    bestSim = sim;
                    bestCluster = c;
                }
            }

            return bestCluster;
        });

        // Check for convergence
        let changed = false;
        for (let i = 0; i < n; i++) {
            if (assignments[i] !== newAssignments[i]) {
                changed = true;
                break;
            }
        }

        assignments = newAssignments;

        if (!changed) {
            console.log(`[Clustering] Converged after ${iter + 1} iterations`);
            break;
        }

        // Update step: recalculate centroids
        const newCentroids: number[][] = Array(k).fill(null).map(() => new Array(dim).fill(0));
        const counts = new Array(k).fill(0);

        for (let i = 0; i < n; i++) {
            const cluster = assignments[i];
            counts[cluster]++;
            for (let d = 0; d < dim; d++) {
                newCentroids[cluster][d] += embeddings[i][d];
            }
        }

        // Average the centroids
        for (let c = 0; c < k; c++) {
            if (counts[c] > 0) {
                for (let d = 0; d < dim; d++) {
                    newCentroids[c][d] /= counts[c];
                }
                // Normalize the centroid
                const norm = Math.sqrt(newCentroids[c].reduce((s, v) => s + v * v, 0));
                if (norm > 0) {
                    for (let d = 0; d < dim; d++) {
                        newCentroids[c][d] /= norm;
                    }
                }
            }
            centroids[c] = newCentroids[c];
        }
    }

    return assignments;
}

/**
 * Cluster posts by semantic similarity
 * Returns array of post clusters
 */
export async function clusterPosts(
    posts: RawPost[],
    k: number = CLUSTERING_CONFIG.NUM_CLUSTERS
): Promise<RawPost[][]> {
    if (posts.length === 0) return [];
    if (posts.length <= k) {
        // Each post is its own cluster if we have fewer posts than clusters
        return posts.map(p => [p]);
    }

    console.log(`[Clustering] Clustering ${posts.length} posts into ${k} groups...`);
    const startTime = Date.now();

    // Get embeddings for all posts
    const texts = posts.map(p => `${p.title}. ${p.body || ""}`.slice(0, 512));
    const embeddings = await getEmbeddings(texts);

    // Run k-means
    const assignments = kMeans(embeddings, k);

    // Group posts by cluster
    const clusters: RawPost[][] = Array(k).fill(null).map(() => []);
    for (let i = 0; i < posts.length; i++) {
        clusters[assignments[i]].push(posts[i]);
    }

    // Remove empty clusters and sort by size (largest first)
    const nonEmptyClusters = clusters
        .filter(c => c.length > 0)
        .sort((a, b) => b.length - a.length);

    console.log(
        `[Clustering] Created ${nonEmptyClusters.length} clusters in ${Date.now() - startTime}ms: ` +
        `[${nonEmptyClusters.map(c => c.length).join(", ")}]`
    );

    return nonEmptyClusters;
}

/**
 * Generate a meaningful theme title from cluster content
 * Uses TF-IDF style scoring to find distinctive words for THIS cluster
 */
export function generateClusterTitle(posts: RawPost[], allPosts?: RawPost[]): string {
    // Extended stop words - very generic terms that don't help identify topics
    const stopWords = new Set([
        // Common English
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
        "by", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "can", "could", "will", "would", "should", "may", "might",
        "must", "i", "you", "he", "she", "it", "we", "they", "my", "your", "his", "her",
        "its", "our", "their", "this", "that", "these", "those", "from", "up", "down",
        "out", "about", "into", "over", "after", "some", "any", "no", "not", "only",
        "own", "other", "so", "than", "too", "very", "just", "if", "when", "where", "why",
        "how", "all", "what", "more", "most", "who", "which", "there", "here", "as",
        // Generic action words
        "best", "looking", "need", "want", "like", "using", "use", "anyone", "know",
        "get", "getting", "got", "going", "good", "new", "way", "make", "one", "help",
        "trying", "try", "find", "found", "work", "working", "works", "really", "thing",
        // Common post patterns
        "recommend", "recommendations", "suggest", "suggestions", "question", "questions",
        "thoughts", "opinion", "opinions", "advice", "experience", "experiences",
        // Time/numbers
        "2024", "2025", "2026", "2027", "first", "second", "last", "top", "year", "years",
        // Generic tech
        "app", "apps", "tool", "tools", "software", "platform", "system", "service",
    ]);

    // Topic patterns to match and use as titles
    const topicPatterns: { pattern: RegExp; title: string }[] = [
        { pattern: /\b(pric|cost|expensive|cheap|free|subscription|pay)/i, title: "Pricing & Cost" },
        { pattern: /\b(alternative|vs|versus|compare|comparison|switch)/i, title: "Alternatives & Comparison" },
        { pattern: /\b(setup|install|config|integration|api|sdk)/i, title: "Setup & Integration" },
        { pattern: /\b(beginner|learn|tutorial|guide|start|getting started)/i, title: "Getting Started" },
        { pattern: /\b(enterprise|team|collaboration|agency|business)/i, title: "Teams & Enterprise" },
        { pattern: /\b(bug|issue|error|problem|broken|fix)/i, title: "Issues & Problems" },
        { pattern: /\b(feature|missing|request|wishlist)/i, title: "Feature Requests" },
        { pattern: /\b(mobile|ios|android|phone)/i, title: "Mobile Experience" },
        { pattern: /\b(self.?host|open.?source|privacy)/i, title: "Self-Hosted & Open Source" },
    ];

    // Check if cluster strongly matches a topic pattern
    const allText = posts.map(p => p.title).join(" ").toLowerCase();
    for (const { pattern, title } of topicPatterns) {
        const matches = (allText.match(pattern) || []).length;
        if (matches >= Math.max(2, posts.length * 0.3)) {
            return title;
        }
    }

    // Fall back to extracting distinctive words
    // Count word frequencies in this cluster
    const clusterWordCounts = new Map<string, number>();

    for (const post of posts) {
        const words = post.title.toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(w => w.length > 3 && !stopWords.has(w));

        // Use set to count each word once per post (document frequency)
        const uniqueWords = new Set(words);
        for (const word of uniqueWords) {
            clusterWordCounts.set(word, (clusterWordCounts.get(word) || 0) + 1);
        }
    }

    // If we have global context, calculate TF-IDF style score
    const globalWordCounts = new Map<string, number>();
    if (allPosts && allPosts.length > posts.length) {
        for (const post of allPosts) {
            const words = post.title.toLowerCase()
                .replace(/[^a-z0-9\s]/g, " ")
                .split(/\s+/)
                .filter(w => w.length > 3 && !stopWords.has(w));

            const uniqueWords = new Set(words);
            for (const word of uniqueWords) {
                globalWordCounts.set(word, (globalWordCounts.get(word) || 0) + 1);
            }
        }
    }

    // Score words by distinctiveness
    const scoredWords: { word: string; score: number }[] = [];

    for (const [word, count] of clusterWordCounts) {
        // Term frequency in cluster
        const tf = count / posts.length;

        // Inverse document frequency (how distinctive is this word?)
        let idf = 1;
        if (globalWordCounts.size > 0) {
            const globalCount = globalWordCounts.get(word) || 1;
            idf = Math.log((allPosts?.length || posts.length) / globalCount);
        }

        // Boost words that appear in multiple posts (minimum threshold)
        const coverageBoost = count >= 2 ? 1.5 : 1;

        scoredWords.push({
            word,
            score: tf * idf * coverageBoost
        });
    }

    // Get top distinctive words
    const topWords = scoredWords
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map(w => w.word);

    if (topWords.length === 0) {
        return "General Discussion";
    }

    // Capitalize nicely
    const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

    if (topWords.length === 1) {
        return capitalize(topWords[0]) + " Discussion";
    }

    return topWords.map(capitalize).join(" & ");
}

