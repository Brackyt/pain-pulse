import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { queryToSlug, isValidSlug } from "@/lib/slug";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { fetchRedditPosts, getSubredditBreakdown } from "@/lib/sources/reddit";
import { fetchHNPosts, getHNBreakdown } from "@/lib/sources/hacker-news";
import { fetchBestQuotes } from "@/lib/sources/reddit-comments";
import { calculateStats, calculatePainSpikes } from "@/lib/analysis/scoring";
import { clusterThemes } from "@/lib/analysis/clustering";
import { generateBuildIdeas } from "@/lib/analysis/ideas";
import { extractTopPhrases } from "@/lib/analysis/signals";
import { PulseReport, PulseReportFirestore } from "@/types/pulse";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

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
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
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
    const rateLimitResult = checkRateLimit(clientIP, RATE_LIMIT_CONFIG);

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
            const age = Date.now() - data.updatedAt;

            if (age < CACHE_DURATION_MS) {
                // Return cached report
                const report: PulseReport = {
                    ...data,
                    createdAt: new Date(data.createdAt),
                    updatedAt: new Date(data.updatedAt),
                };

                return NextResponse.json({
                    report,
                    cached: true,
                    slug,
                });
            }
        }

        console.log(`Generating report for: ${query}`);

        // Fetch data from sources in parallel (with partial failure tolerance)
        const [redditPosts, hnPosts] = await Promise.all([
            fetchRedditPosts(query).catch((e) => {
                console.error("Reddit fetch failed:", e);
                return [];
            }),
            fetchHNPosts(query).catch((e) => {
                console.error("HN fetch failed:", e);
                return [];
            }),
        ]);

        const allPosts = [...redditPosts, ...hnPosts];

        if (allPosts.length === 0) {
            return NextResponse.json(
                { error: "No results found for this query. Try a different keyword." },
                { status: 404 }
            );
        }

        console.log(`Total posts: ${allPosts.length}`);

        // Compute basic metrics (fast)
        const stats = calculateStats(allPosts);
        const painSpikes = calculatePainSpikes(allPosts);
        const topPhrases = extractTopPhrases(allPosts);

        // Source breakdown (fast)
        const sourceBreakdown = {
            reddit: getSubredditBreakdown(redditPosts),
            hackernews: getHNBreakdown(hnPosts),
        };

        // Fetch best quotes from Reddit comments (parallel with embeddings)
        // AND run embedding-based clustering
        const [bestQuotes, themes] = await Promise.all([
            fetchBestQuotes(redditPosts, 10, 10).catch((e) => {
                console.error("Quote extraction failed:", e);
                return [];
            }),
            clusterThemes(allPosts, 5).catch((e) => {
                console.error("Clustering failed:", e);
                return [];
            }),
        ]);

        // Generate build ideas based on themes
        const buildIdeas = generateBuildIdeas(themes, query);

        const now = Date.now();
        const reportFirestore: PulseReportFirestore = {
            query,
            slug,
            createdAt: existingDoc.exists
                ? (existingDoc.data() as PulseReportFirestore).createdAt
                : now,
            updatedAt: now,
            windowDays: 7,
            stats,
            painSpikes,
            topPhrases,
            themes,
            sourceBreakdown,
            buildIdeas,
            bestQuotes,
        };

        // Store in Firestore
        await docRef.set(reportFirestore);

        const report: PulseReport = {
            ...reportFirestore,
            createdAt: new Date(reportFirestore.createdAt),
            updatedAt: new Date(reportFirestore.updatedAt),
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
