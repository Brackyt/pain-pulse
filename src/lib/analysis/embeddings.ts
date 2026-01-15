import { pipeline, FeatureExtractionPipeline } from "@xenova/transformers";
import { RawPost } from "@/types/pulse";

// Singleton for the embedding pipeline
let embeddingPipeline: FeatureExtractionPipeline | null = null;
let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

/**
 * Configuration for semantic relevance
 */
export const SEMANTIC_CONFIG = {
    // Minimum cosine similarity to consider a post relevant
    // 0.35 is relatively permissive to catch edge cases like product comparisons
    SIMILARITY_THRESHOLD: 0.35,
    // Number of posts to embed per batch
    BATCH_SIZE: 20,
    // Model to use for embeddings
    MODEL_NAME: "Xenova/all-MiniLM-L6-v2",
};

/**
 * Get or initialize the embedding pipeline (singleton)
 * Uses lazy loading - model downloads on first use (~22MB)
 */
async function getEmbeddingPipeline(): Promise<FeatureExtractionPipeline> {
    if (embeddingPipeline) {
        return embeddingPipeline;
    }

    if (pipelinePromise) {
        return pipelinePromise;
    }

    console.log(`[Embeddings] Loading model: ${SEMANTIC_CONFIG.MODEL_NAME}...`);
    const startTime = Date.now();

    pipelinePromise = pipeline("feature-extraction", SEMANTIC_CONFIG.MODEL_NAME, {
        // Use quantized model for faster inference
        quantized: true,
    });

    embeddingPipeline = await pipelinePromise;
    console.log(`[Embeddings] Model loaded in ${Date.now() - startTime}ms`);

    return embeddingPipeline;
}

/**
 * Generate embeddings for an array of texts
 * Returns a 2D array where each row is the embedding vector for the corresponding text
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const pipe = await getEmbeddingPipeline();

    // Process in batches to avoid memory issues
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += SEMANTIC_CONFIG.BATCH_SIZE) {
        const batch = texts.slice(i, i + SEMANTIC_CONFIG.BATCH_SIZE);

        // Generate embeddings for the batch
        // Output is a Tensor with shape [batch_size, hidden_size] when pooling=mean
        const output = await pipe(batch, {
            pooling: "mean",
            normalize: true,
        });

        // Get the raw data from the tensor
        // Shape is [batch_size, hidden_size] = [n, 384] for all-MiniLM-L6-v2
        const data = output.data as Float32Array;
        const dims = output.dims as number[];
        const hiddenSize = dims[dims.length - 1]; // Last dimension is hidden size (384)

        // Extract each embedding from the flattened data
        for (let j = 0; j < batch.length; j++) {
            const start = j * hiddenSize;
            const end = start + hiddenSize;
            const embedding = Array.from(data.slice(start, end));
            embeddings.push(embedding);
        }
    }

    return embeddings;
}

/**
 * Compute cosine similarity between two vectors
 * Returns a value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;

    return dotProduct / magnitude;
}

/**
 * Calculate semantic relevance between a query and a post
 * Returns a similarity score between 0 and 1
 */
export async function calculateSemanticRelevance(
    queryEmbedding: number[],
    post: RawPost
): Promise<number> {
    // Combine title and body for richer context (title weighted more by being first)
    const postText = `${post.title}. ${post.body || ""}`.slice(0, 512); // Limit length

    const [postEmbedding] = await getEmbeddings([postText]);

    return cosineSimilarity(queryEmbedding, postEmbedding);
}

/**
 * Batch calculate semantic relevance for multiple posts
 * More efficient than calling calculateSemanticRelevance for each post
 */
export async function batchCalculateRelevance(
    query: string,
    posts: RawPost[]
): Promise<Map<string, number>> {
    if (posts.length === 0) {
        return new Map();
    }

    console.log(`[Embeddings] Computing relevance for ${posts.length} posts...`);
    const startTime = Date.now();

    // Prepare texts: query + all posts
    const texts = [
        query,
        ...posts.map((p) => `${p.title}. ${p.body || ""}`.slice(0, 512)),
    ];

    // Get all embeddings in batches
    const embeddings = await getEmbeddings(texts);

    // First embedding is the query
    const queryEmbedding = embeddings[0];

    // Calculate similarity for each post
    const relevanceMap = new Map<string, number>();

    for (let i = 0; i < posts.length; i++) {
        const postEmbedding = embeddings[i + 1];
        const similarity = cosineSimilarity(queryEmbedding, postEmbedding);
        relevanceMap.set(posts[i].id, similarity);
    }

    console.log(`[Embeddings] Computed ${posts.length} similarities in ${Date.now() - startTime}ms`);

    return relevanceMap;
}

/**
 * Filter posts by semantic relevance to a query
 * Returns posts sorted by relevance (highest first)
 */
export async function filterBySemanticRelevance(
    query: string,
    posts: RawPost[],
    threshold: number = SEMANTIC_CONFIG.SIMILARITY_THRESHOLD
): Promise<RawPost[]> {
    const relevanceMap = await batchCalculateRelevance(query, posts);

    const filtered = posts
        .map((post) => ({
            post,
            similarity: relevanceMap.get(post.id) || 0,
        }))
        .filter((item) => item.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .map((item) => item.post);

    console.log(
        `[Embeddings] Semantic filter: ${posts.length} posts → ${filtered.length} relevant (threshold: ${threshold})`
    );

    return filtered;
}

// ============================================
// PAIN DETECTION VIA SEMANTIC SIMILARITY
// ============================================

/**
 * Pain Archetypes - template sentences representing different types of pain
 * A sentence is considered "pain" if semantically similar to any of these
 */
const PAIN_ARCHETYPES = [
    // Frustration & Annoyance
    "This is so frustrating and annoying to use",
    "I hate how difficult and frustrating this is",
    "This is a complete nightmare to deal with",

    // Cost & Pricing Pain
    "The pricing is way too expensive for what you get",
    "I can't afford this tool, it's too costly",
    "The subscription cost is ridiculously high",

    // Complexity & Learning Curve
    "This is way too complicated to set up and configure",
    "The learning curve is too steep for our team",
    "It's overly complex and bloated with features we don't need",

    // Giving Up & Switching
    "I gave up and switched to something else",
    "We stopped using it because it was too painful",
    "Had to abandon this tool after too many issues",

    // Quality & Reliability Issues  
    "This tool is buggy and unreliable",
    "It keeps breaking and failing when we need it",
    "The software crashes constantly and loses our work",

    // Missing Features & Limitations
    "It's missing basic features that we need",
    "The limitations are too restrictive for our use case",
    "We hit a wall because it can't do what we need",

    // Waste of Time & Effort
    "This was a complete waste of time and money",
    "We spent hours trying to make it work",
    "The workarounds required are not worth it",
];

/**
 * NOT Pain Archetypes - patterns that look like requests/questions, not complaints
 * If a sentence is MORE similar to these than to pain archetypes, exclude it
 */
const NOT_PAIN_ARCHETYPES = [
    // Simple requests for recommendations
    "Can you suggest some good tools for this",
    "What are the best options available",
    "Looking for recommendations please",
    "Does anyone have suggestions for me",

    // General questions
    "What do you think about this tool",
    "Has anyone tried this before",
    "Which one should I choose",
    "What are your thoughts on this",

    // Neutral feature questions
    "Does this tool have this feature",
    "How does this compare to that",
    "What's the difference between these",

    // Positive/neutral statements
    "This tool works great for my needs",
    "I really like using this software",
    "Here's a list of popular options",
];

// Cache for archetype embeddings (computed once, reused)
let archetypeEmbeddings: number[][] | null = null;
let archetypeEmbeddingsPromise: Promise<number[][]> | null = null;
let notPainEmbeddings: number[][] | null = null;
let notPainEmbeddingsPromise: Promise<number[][]> | null = null;

/**
 * Get cached pain archetype embeddings
 */
async function getArchetypeEmbeddings(): Promise<number[][]> {
    if (archetypeEmbeddings) {
        return archetypeEmbeddings;
    }

    if (archetypeEmbeddingsPromise) {
        return archetypeEmbeddingsPromise;
    }

    console.log(`[Pain Detection] Computing archetype embeddings...`);
    archetypeEmbeddingsPromise = getEmbeddings(PAIN_ARCHETYPES);
    archetypeEmbeddings = await archetypeEmbeddingsPromise;
    console.log(`[Pain Detection] Cached ${archetypeEmbeddings.length} pain archetypes`);

    return archetypeEmbeddings;
}

/**
 * Get cached NOT-pain archetype embeddings
 */
async function getNotPainEmbeddings(): Promise<number[][]> {
    if (notPainEmbeddings) {
        return notPainEmbeddings;
    }

    if (notPainEmbeddingsPromise) {
        return notPainEmbeddingsPromise;
    }

    notPainEmbeddingsPromise = getEmbeddings(NOT_PAIN_ARCHETYPES);
    notPainEmbeddings = await notPainEmbeddingsPromise;
    console.log(`[Pain Detection] Cached ${notPainEmbeddings.length} not-pain archetypes`);

    return notPainEmbeddings;
}

/**
 * Score a single sentence for pain using semantic similarity
 * Returns max similarity to any pain archetype (0-1)
 */
export async function scoreSentencePain(sentenceEmbedding: number[]): Promise<number> {
    const archetypes = await getArchetypeEmbeddings();

    let maxSimilarity = 0;
    for (const archetypeEmb of archetypes) {
        const similarity = cosineSimilarity(sentenceEmbedding, archetypeEmb);
        if (similarity > maxSimilarity) {
            maxSimilarity = similarity;
        }
    }

    return maxSimilarity;
}

/**
 * Configuration for pain detection
 */
export const PAIN_CONFIG = {
    // Minimum similarity to a pain archetype to be considered "pain"
    PAIN_THRESHOLD: 0.50,
    // Strong pain signal threshold (for boosting)
    STRONG_PAIN_THRESHOLD: 0.58,
    // If not-pain score exceeds pain score by this margin, exclude it
    NOT_PAIN_MARGIN: 0.05,
};

/**
 * Batch score multiple sentences for pain
 * Returns map of sentence -> pain score (0 if filtered as not-pain)
 */
export async function batchScorePain(
    sentences: string[]
): Promise<Map<string, number>> {
    if (sentences.length === 0) {
        return new Map();
    }

    console.log(`[Pain Detection] Scoring ${sentences.length} sentences...`);
    const startTime = Date.now();

    // Get embeddings for all sentences
    const sentenceEmbeddings = await getEmbeddings(sentences);

    // Get both archetype sets (cached)
    const painArchetypes = await getArchetypeEmbeddings();
    const notPainArchetypes = await getNotPainEmbeddings();

    // Score each sentence against both archetype sets
    const painScores = new Map<string, number>();

    for (let i = 0; i < sentences.length; i++) {
        // Max similarity to pain archetypes
        let maxPainSim = 0;
        for (const archetypeEmb of painArchetypes) {
            const similarity = cosineSimilarity(sentenceEmbeddings[i], archetypeEmb);
            if (similarity > maxPainSim) {
                maxPainSim = similarity;
            }
        }

        // Max similarity to NOT-pain archetypes
        let maxNotPainSim = 0;
        for (const archetypeEmb of notPainArchetypes) {
            const similarity = cosineSimilarity(sentenceEmbeddings[i], archetypeEmb);
            if (similarity > maxNotPainSim) {
                maxNotPainSim = similarity;
            }
        }

        // If sentence is more similar to not-pain than pain (with margin), score it as 0
        if (maxNotPainSim > maxPainSim + PAIN_CONFIG.NOT_PAIN_MARGIN) {
            painScores.set(sentences[i], 0);
        } else {
            painScores.set(sentences[i], maxPainSim);
        }
    }

    const painCount = [...painScores.values()].filter(s => s >= PAIN_CONFIG.PAIN_THRESHOLD).length;
    console.log(`[Pain Detection] Found ${painCount}/${sentences.length} pain sentences in ${Date.now() - startTime}ms`);

    return painScores;
}


