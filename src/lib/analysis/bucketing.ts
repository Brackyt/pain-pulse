import { RawPost, Theme } from "@/types/pulse";
import { extractPainReceipts, extractTopPhrases } from "@/lib/analysis/signals";
import { clusterPosts, generateClusterTitle, CLUSTERING_CONFIG } from "@/lib/analysis/clustering";

/**
 * Assign posts to dynamic semantic clusters and generate Themes
 * Uses embedding-based clustering instead of keyword matching
 */
export async function bucketPosts(posts: RawPost[]): Promise<Theme[]> {
    if (posts.length === 0) return [];

    // Cluster posts semantically
    const clusters = await clusterPosts(posts, CLUSTERING_CONFIG.NUM_CLUSTERS);

    const totalPosts = posts.length;
    const themes: Theme[] = [];

    for (const clusterPosts of clusters) {
        if (clusterPosts.length === 0) continue;

        // Calculate share
        const share = Math.round((clusterPosts.length / totalPosts) * 100);

        // Generate title from cluster content (pass all posts for TF-IDF distinctiveness)
        const title = generateClusterTitle(clusterPosts, posts);

        // Extract "Pain Receipts" for this cluster (async)
        const quotes = await extractPainReceipts(clusterPosts, 5);

        // Extract Top Phrases for this cluster
        const phraseObjs = extractTopPhrases(clusterPosts, 5);
        const keywords = phraseObjs.map(p => p.phrase);

        // Top 3 sources by engagement
        const sources = clusterPosts
            .sort((a, b) => ((b.score || 0) + (b.comments || 0)) - ((a.score || 0) + (a.comments || 0)))
            .slice(0, 3)
            .map(p => ({
                title: p.title,
                url: p.url,
                source: p.source
            }));

        themes.push({
            title,
            share,
            quotes,
            keywords,
            sources
        });
    }

    // Sort by share (largest first)
    return themes.sort((a, b) => b.share - a.share);
}
