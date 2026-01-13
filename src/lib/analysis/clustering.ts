import { RawPost, Theme, SourceLink } from "@/types/pulse";
import {
    embedPosts,
    cosineSimilarity,
    calculateCentroid,
} from "./embeddings";
import { analyzePost } from "./signals";

interface Cluster {
    centroid: number[];
    posts: { post: RawPost; embedding: number[] }[];
}

/**
 * K-means clustering on embeddings
 */
function kMeansClustering(
    items: { post: RawPost; embedding: number[] }[],
    k: number,
    maxIterations: number = 10
): Cluster[] {
    if (items.length === 0 || k <= 0) return [];

    const actualK = Math.min(k, items.length);

    // Initialize centroids using k-means++ style selection
    const centroids: number[][] = [];
    const usedIndices = new Set<number>();

    // First centroid: random
    const firstIdx = Math.floor(Math.random() * items.length);
    centroids.push([...items[firstIdx].embedding]);
    usedIndices.add(firstIdx);

    // Remaining centroids: pick points far from existing centroids
    while (centroids.length < actualK) {
        let maxMinDist = -1;
        let bestIdx = 0;

        for (let i = 0; i < items.length; i++) {
            if (usedIndices.has(i)) continue;

            // Find min distance to existing centroids
            let minDist = Infinity;
            for (const centroid of centroids) {
                const sim = cosineSimilarity(items[i].embedding, centroid);
                const dist = 1 - sim;
                minDist = Math.min(minDist, dist);
            }

            if (minDist > maxMinDist) {
                maxMinDist = minDist;
                bestIdx = i;
            }
        }

        centroids.push([...items[bestIdx].embedding]);
        usedIndices.add(bestIdx);
    }

    // Iterate
    let clusters: Cluster[] = centroids.map((c) => ({ centroid: c, posts: [] }));

    for (let iter = 0; iter < maxIterations; iter++) {
        // Clear clusters
        for (const cluster of clusters) {
            cluster.posts = [];
        }

        // Assign each item to nearest centroid
        for (const item of items) {
            let bestCluster = 0;
            let bestSim = -1;

            for (let j = 0; j < clusters.length; j++) {
                const sim = cosineSimilarity(item.embedding, clusters[j].centroid);
                if (sim > bestSim) {
                    bestSim = sim;
                    bestCluster = j;
                }
            }

            clusters[bestCluster].posts.push(item);
        }

        // Update centroids
        for (const cluster of clusters) {
            if (cluster.posts.length > 0) {
                cluster.centroid = calculateCentroid(
                    cluster.posts.map((p) => p.embedding)
                );
            }
        }
    }

    // Filter empty clusters
    clusters = clusters.filter((c) => c.posts.length > 0);

    return clusters;
}

/**
 * Extract key phrases from posts using TF-IDF-like scoring
 */
function extractKeyPhrases(posts: RawPost[], topN: number = 3): string[] {
    const stopWords = new Set([
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
        "really", "need", "want", "think", "know", "see", "way", "make", "made",
        // URL-related garbage
        "http", "https", "www", "com", "org", "net", "io", "html", "htm", "php",
        "reddit", "redd", "youtu", "youtube", "imgur", "twitter", "github",
        // Common filler
        "amp", "nbsp", "quot", "etc", "something", "anything", "nothing", "someone",
        "anyone", "everyone", "thing", "things", "stuff", "lot", "lots", "bit",
    ]);

    // Count bigrams
    const bigramCounts = new Map<string, number>();

    for (const post of posts) {
        const text = `${post.title} ${post.body}`.toLowerCase();
        const words = text
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter((w) => w.length > 2 && !stopWords.has(w));

        // Bigrams
        for (let i = 0; i < words.length - 1; i++) {
            const bigram = `${words[i]} ${words[i + 1]}`;
            bigramCounts.set(bigram, (bigramCounts.get(bigram) || 0) + 1);
        }
    }

    // Sort by count and return top N
    const sorted = Array.from(bigramCounts.entries())
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([phrase]) => phrase);

    return sorted;
}

/**
 * Generate a theme title from key phrases
 */
function generateThemeTitle(posts: RawPost[]): string {
    const phrases = extractKeyPhrases(posts, 1);

    if (phrases.length > 0) {
        // Capitalize nicely
        return phrases[0]
            .split(" ")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    }

    // Fallback: use most common word
    const wordCounts = new Map<string, number>();
    const stopWords = new Set(["the", "a", "an", "and", "or", "for", "to", "is", "are"]);

    for (const post of posts) {
        const words = post.title
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .split(/\s+/)
            .filter((w) => w.length > 3 && !stopWords.has(w));

        for (const word of words) {
            wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
        }
    }

    const topWord = Array.from(wordCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];

    if (topWord) {
        return topWord[0].charAt(0).toUpperCase() + topWord[0].slice(1);
    }

    return "General Discussion";
}

/**
 * Cluster posts using embeddings and generate themes
 */
export async function clusterThemes(
    posts: RawPost[],
    maxThemes: number = 5
): Promise<Theme[]> {
    if (posts.length === 0) return [];

    // Only analyze posts with some engagement or pain signals
    const relevantPosts = posts.filter((post) => {
        const { painScore, buyerScore } = analyzePost(post);
        const hasSignals = painScore > 0 || buyerScore > 0;
        const hasEngagement = post.score >= 2 || post.comments >= 2;
        return hasSignals || hasEngagement;
    });

    if (relevantPosts.length < 5) {
        console.log("Not enough relevant posts for clustering");
        return [];
    }

    // Cap at 100 posts for performance
    const postsToEmbed = relevantPosts.slice(0, 100);

    console.log(`Embedding ${postsToEmbed.length} posts...`);
    const embedded = await embedPosts(postsToEmbed);
    console.log("Embedding complete. Clustering...");

    // Determine number of clusters (aim for 3-5 meaningful clusters)
    const k = Math.min(maxThemes, Math.max(3, Math.floor(postsToEmbed.length / 10)));

    const clusters = kMeansClustering(embedded, k);

    // Sort clusters by size
    clusters.sort((a, b) => b.posts.length - a.posts.length);

    // Convert clusters to themes
    const themes: Theme[] = [];

    for (const cluster of clusters.slice(0, maxThemes)) {
        if (cluster.posts.length < 2) continue;

        const clusterPosts = cluster.posts.map((p) => p.post);

        // Calculate share
        const share = Math.round((clusterPosts.length / posts.length) * 100);

        // Get representative posts (closest to centroid)
        const ranked = cluster.posts
            .map((item) => ({
                post: item.post,
                similarity: cosineSimilarity(item.embedding, cluster.centroid),
            }))
            .sort((a, b) => b.similarity - a.similarity);

        // Extract best quotes
        const quotes = ranked
            .slice(0, 5)
            .map((r) => {
                const text = r.post.body || r.post.title;
                return text.length > 200 ? text.slice(0, 200) + "..." : text;
            })
            .filter((q) => q.length > 30);

        // Build source links
        const sources: SourceLink[] = ranked.slice(0, 3).map((r) => ({
            title:
                r.post.title.slice(0, 60) + (r.post.title.length > 60 ? "..." : ""),
            url: r.post.url,
            source: r.post.source,
        }));

        // Generate theme title
        const title = generateThemeTitle(clusterPosts);

        themes.push({
            title,
            share,
            quotes: quotes.slice(0, 3),
            sources,
        });
    }

    console.log(`Generated ${themes.length} themes`);
    return themes;
}
