import { RawPost, Theme } from "@/types/pulse";
import { extractPainReceipts, extractTopPhrases } from "@/lib/analysis/signals";

// Static Intent Buckets
const BUCKETS = [
    {
        id: "alternatives",
        title: "Market Landscape", // RENAMED from "Alternatives & Competitors"
        keywords: [
            "alternative", "competitor", "vs", "versus", "switch from",
            "replace", "similar like", "better than"
        ]
    },
    {
        id: "pricing",
        title: "Pricing Frustrations", // RENAMED
        keywords: [
            "pricing", "cost", "price", "expensive", "cheap", "free",
            "subscription", "lifetime", "payment", "billing", "afford"
        ]
    },
    {
        id: "setup",
        title: "Setup & How-To",
        keywords: [
            "how to", "setup", "install", "configure", "tutorial",
            "guide", "documentation", "api", "sdk", "integration"
        ]
    },
    {
        id: "opinions",
        title: "Discussions & Opinions",
        keywords: [] // Catch-all for high engagement
    }
];

/**
 * Assign posts to buckets and generate Themes
 * Now includes per-bucket phrases and high-quality quotes ("receipts")
 */
export async function bucketPosts(posts: RawPost[]): Promise<Theme[]> {
    const bucketMap = new Map<string, RawPost[]>();

    // Initialize buckets
    BUCKETS.forEach(b => bucketMap.set(b.id, []));

    // Assign posts
    posts.forEach(post => {
        const text = `${post.title} ${post.body}`.toLowerCase();
        let assigned = false;

        for (const bucket of BUCKETS) {
            if (bucket.id === "opinions") continue; // Process last

            if (bucket.keywords.some(k => text.includes(k))) {
                bucketMap.get(bucket.id)?.push(post);
                assigned = true;
                break; // One bucket per post for simplicity
            }
        }

        if (!assigned) {
            // Default to Opinions if it has engagement
            if ((post.score || 0) > 2 || (post.comments || 0) > 0) {
                bucketMap.get("opinions")?.push(post);
            }
        }
    });

    // Generate Themes from Buckets
    const totalPosts = posts.length;
    const themes: Theme[] = [];

    for (const bucket of BUCKETS) {
        const bucketPosts = bucketMap.get(bucket.id) || [];
        if (bucketPosts.length === 0) continue;

        const share = Math.round((bucketPosts.length / totalPosts) * 100);

        // Extract "Pain Receipts" specifically for this bucket
        // Renamed function call
        const quotes = extractPainReceipts(bucketPosts, 5);

        // Extract Top Phrases specifically for this bucket
        // Map TopPhrase[] -> string[] for Theme interface compatibility
        const phraseObjs = extractTopPhrases(bucketPosts, 5); // Get top 5 phrases
        const keywords = phraseObjs.map(p => p.phrase);

        // Top 3 sources
        const sources = bucketPosts
            .sort((a, b) => ((b.score || 0) + (b.comments || 0)) - ((a.score || 0) + (a.comments || 0)))
            .slice(0, 3)
            .map(p => ({
                title: p.title,
                url: p.url,
                source: p.source
            }));

        themes.push({
            title: bucket.title,
            share,
            quotes,
            keywords, // Now populated with per-bucket phrases
            sources
        });
    }

    return themes.sort((a, b) => b.share - a.share);
}
