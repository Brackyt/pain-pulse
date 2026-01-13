// @ts-nocheck - Transformers.js types are not fully compatible
import { pipeline } from "@xenova/transformers";
import { RawPost } from "@/types/pulse";

// Use a small, fast model optimized for semantic similarity
const MODEL_NAME = "Xenova/all-MiniLM-L6-v2";

let embeddingPipeline: any = null;

/**
 * Initialize the embedding pipeline (lazy loading)
 */
async function getEmbeddingPipeline(): Promise<any> {
    if (!embeddingPipeline) {
        console.log("Loading embedding model...");
        embeddingPipeline = await pipeline("feature-extraction", MODEL_NAME, {
            quantized: true, // Use quantized model for speed
        });
        console.log("Embedding model loaded.");
    }
    return embeddingPipeline;
}

/**
 * Generate embedding for a single text
 */
export async function embedText(text: string): Promise<number[]> {
    const pipe = await getEmbeddingPipeline();

    // Truncate to ~256 tokens worth of text (~1000 chars)
    const truncated = text.slice(0, 1000);

    const result = await pipe(truncated, {
        pooling: "mean",
        normalize: true,
    });

    // Convert to array
    return Array.from(result.data as Float32Array);
}

/**
 * Generate embeddings for multiple posts
 */
export async function embedPosts(
    posts: RawPost[]
): Promise<{ post: RawPost; embedding: number[] }[]> {
    const pipe = await getEmbeddingPipeline();

    const results: { post: RawPost; embedding: number[] }[] = [];

    // Process in batches to avoid memory issues
    const batchSize = 10;

    for (let i = 0; i < posts.length; i += batchSize) {
        const batch = posts.slice(i, i + batchSize);

        const embeddings = await Promise.all(
            batch.map(async (post) => {
                const text = `${post.title} ${post.body}`.slice(0, 1000);
                const result = await pipe(text, {
                    pooling: "mean",
                    normalize: true,
                });
                return Array.from(result.data as Float32Array);
            })
        );

        for (let j = 0; j < batch.length; j++) {
            results.push({
                post: batch[j],
                embedding: embeddings[j],
            });
        }
    }

    return results;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Calculate centroid of a set of embeddings
 */
export function calculateCentroid(embeddings: number[][]): number[] {
    if (embeddings.length === 0) return [];

    const dim = embeddings[0].length;
    const centroid = new Array(dim).fill(0);

    for (const emb of embeddings) {
        for (let i = 0; i < dim; i++) {
            centroid[i] += emb[i];
        }
    }

    for (let i = 0; i < dim; i++) {
        centroid[i] /= embeddings.length;
    }

    // Normalize
    let norm = 0;
    for (let i = 0; i < dim; i++) {
        norm += centroid[i] * centroid[i];
    }
    norm = Math.sqrt(norm);

    if (norm > 0) {
        for (let i = 0; i < dim; i++) {
            centroid[i] /= norm;
        }
    }

    return centroid;
}
