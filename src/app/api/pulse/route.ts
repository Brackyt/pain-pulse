import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { queryToSlug, isValidSlug } from "@/lib/slug";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { fetchRedditPosts, getSubredditBreakdown } from "@/lib/sources/reddit";
import { fetchHNPosts, getHNBreakdown } from "@/lib/sources/hacker-news";
import { calculateStats, calculatePainSpikesFromCounts } from "@/lib/analysis/scoring";
import { bucketPosts } from "@/lib/analysis/bucketing";
import { generateBuildIdeas } from "@/lib/analysis/ideas";
import { extractTopPhrases, extractPainReceipts, extractPainPoints } from "@/lib/analysis/signals";
import { filterByRelevance } from "@/lib/analysis/relevance";
import { PulseReport, PulseReportFirestore, RawPost } from "@/types/pulse";
import { Timestamp } from "firebase-admin/firestore";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Helper to safely convert Firestore timestamp or number to Date
function toDate(val: Timestamp | number | Date): Date {
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(val);
    if (val && typeof (val as Timestamp).toDate === 'function') {
        return (val as Timestamp).toDate();
    }
    // Fallback for unexpected types
    return new Date();
}

// Rate limit config: 10 requests per minute per IP
const RATE_LIMIT_CONFIG = {
    maxRequests: 10,
    windowMs: 60 * 1000,
};

/**
 * GET /api/pulse?slug=...
 * Returns cached report only
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    if (!slug || !isValidSlug(slug)) {
        return NextResponse.json(
            { error: "Invalid or missing slug parameter" },
            { status: 400 }
        );
    }

    try {
        const docRef = db.collection("pulses").doc(slug);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        const data = doc.data() as PulseReportFirestore;

        // Convert timestamps to dates
        const report: PulseReport = {
            ...data,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        };

        return NextResponse.json(report);
    } catch (error) {
        console.error("Failed to fetch report:", error);
        return NextResponse.json(
            { error: "Failed to fetch report" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/pulse
 * Generate or return cached report
 */
export async function POST(request: NextRequest) {
    // Rate limiting
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            {
                error: "Too many requests. Please try again later.",
                retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(
                        Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
                    ),
                },
            }
        );
    }

    try {
        const body = await request.json();
        const query = body.query?.trim();

        if (!query || typeof query !== "string" || query.length < 2) {
            return NextResponse.json(
                { error: "Query must be at least 2 characters" },
                { status: 400 }
            );
        }

        if (query.length > 100) {
            return NextResponse.json(
                { error: "Query must be less than 100 characters" },
                { status: 400 }
            );
        }

        const slug = queryToSlug(query);

        if (!isValidSlug(slug)) {
            return NextResponse.json(
                { error: "Invalid query format" },
                { status: 400 }
            );
        }

        // Check cache
        const docRef = db.collection("pulses").doc(slug);
        const existingDoc = await docRef.get();

        if (existingDoc.exists) {
            const data = existingDoc.data() as PulseReportFirestore;
            const updatedAtMs = toDate(data.updatedAt).getTime();
            const age = Date.now() - updatedAtMs;

            if (age < CACHE_DURATION_MS) {
                // Return cached report
                const report: PulseReport = {
                    ...data,
                    createdAt: toDate(data.createdAt),
                    updatedAt: toDate(data.updatedAt),
                };

                return NextResponse.json({
                    report,
                    cached: true,
                    slug,
                });
            }
        }

        console.log(`Generating Intent-First report for: ${query}`);

        // 1. COLLECT: Fetch data using Intent Templates
        let redditRateLimited = false;
        const [redditPosts, hnData] = await Promise.all([
            fetchRedditPosts(query).catch((e) => {
                if (e instanceof Error && e.message === "REDDIT_RATE_LIMITED") {
                    console.warn("Reddit rate limited");
                    redditRateLimited = true;
                    return [] as RawPost[];
                }
                console.error("Reddit fetch failed:", e);
                return [] as RawPost[];
            }),
            fetchHNPosts(query).catch((e) => {
                console.error("HN fetch failed:", e);
                return { weekly: [] as RawPost[], monthly: [] as RawPost[] };
            }),
        ]);

        // Combine all posts for analysis (use monthly for full dataset)
        const allPostsRaw = [...redditPosts, ...hnData.monthly];

        if (allPostsRaw.length === 0) {
            if (redditRateLimited) {
                return NextResponse.json(
                    { error: "Reddit is temporarily limiting requests. Please try again in a few minutes." },
                    { status: 503 }
                );
            }
            return NextResponse.json(
                { error: "No results found for this query. Try a different keyword." },
                { status: 404 }
            );
        }

        console.log(`Raw posts: ${allPostsRaw.length}`);

        // CRITICAL: Apply relevance filtering BEFORE any analysis
        const allPosts = filterByRelevance(allPostsRaw, query, 3);

        if (allPosts.length < 5) {
            return NextResponse.json(
                { error: "Not enough relevant results found. Try a more specific query." },
                { status: 404 }
            );
        }

        console.log(`Relevant posts after filtering: ${allPosts.length}`);

        // Filter Reddit posts by relevance too
        // Calculate volume for "Pain Spike"
        // Monthly = All relevant posts (since we fetch ~30d by default on reddit, and monthly top on HN)
        const monthlyVolume = allPosts.length;

        // Weekly = Filter relevant posts by creation date > 7d ago
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const weeklyVolume = allPosts.filter(
            (p) => p.createdAt.getTime() > weekAgo
        ).length;

        // Compute metrics
        const stats = calculateStats(allPosts);
        const painSpikes = calculatePainSpikesFromCounts(weeklyVolume, monthlyVolume);

        // Buckets: Static Intent Buckets (Alternatives, Pricing, etc.)
        // This now handles phrase extraction per-bucket
        const themes = await bucketPosts(allPosts, query);

        // Top Phrases: Aggregate from themes or keep simple global extraction?
        // Let's keep a global list for the UI sidebar, but make sure it uses the new logic
        const topPhrases = extractTopPhrases(allPosts, 20);

        // Source breakdown (use filtered posts)
        const sourceBreakdown = {
            reddit: getSubredditBreakdown(allPosts.filter(p => p.source === 'reddit')),
            hackernews: getHNBreakdown(hnData.monthly),
        };

        // Pain Extraction (The Pivot)
        // 1. Top Frictions: Short impactful pain statements
        const frictions = extractPainPoints(allPosts, 5);

        // 2. Pain Receipts: Longer "proof" quotes
        const painReceipts = extractPainReceipts(allPosts, 6);

        // Generate build ideas based on themes
        const buildIdeas = generateBuildIdeas(themes, query);

        // 3. CACHE: Store report
        const reportFirestore: PulseReportFirestore = {
            query,
            slug,
            createdAt: existingDoc.exists && (existingDoc.data() as PulseReportFirestore).createdAt
                ? (existingDoc.data() as PulseReportFirestore).createdAt
                : Timestamp.now(),
            updatedAt: Timestamp.now(),
            windowDays: 7,
            stats,
            painSpikes,
            topPhrases,
            themes,
            sourceBreakdown,
            buildIdeas,
            frictions,
            painReceipts
        };

        // Store in Firestore
        await docRef.set(reportFirestore);

        const report: PulseReport = {
            ...reportFirestore,
            createdAt: toDate(reportFirestore.createdAt),
            updatedAt: toDate(reportFirestore.updatedAt),
        };

        console.log(`Report generated successfully for: ${query}`);

        return NextResponse.json({
            report,
            cached: false,
            slug,
        });
    } catch (error) {
        console.error("Failed to generate report:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}
