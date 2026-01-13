/**
 * Simple in-memory rate limiter using sliding window
 */

import { getDb } from "./firebase-admin";

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    resetAt: number;
}

/**
 * Check rate limit using Firestore
 */
export async function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): Promise<RateLimitResult> {
    const now = Date.now();
    const cleanIdentifier = identifier.replace(/[^a-zA-Z0-9]/g, "_"); // Sanitize for doc ID
    const db = getDb();
    const docRef = db.collection("rate_limits").doc(cleanIdentifier);

    try {
        const result = await db.runTransaction(async (t) => {
            const doc = await t.get(docRef);
            const data = doc.data();

            let count = 0;
            let resetAt = now + config.windowMs;

            if (doc.exists && data) {
                if (data.resetAt > now) {
                    // Window still active
                    count = data.count;
                    resetAt = data.resetAt;
                } else {
                    // Window expired, reset
                    count = 0;
                    resetAt = now + config.windowMs;
                }
            }

            if (count >= config.maxRequests) {
                return {
                    success: false,
                    remaining: 0,
                    resetAt,
                };
            }

            count++;

            t.set(docRef, { count, resetAt });

            return {
                success: true,
                remaining: config.maxRequests - count,
                resetAt,
            };
        });

        return result;
    } catch (error) {
        console.error("Rate limit check failed:", error);
        // Fail open to avoid blocking users if DB fails
        return {
            success: true,
            remaining: 1,
            resetAt: now + config.windowMs,
        };
    }
}

import { NextRequest } from "next/server";

/**
 * Get client IP from request
 */
export function getClientIP(request: Request | NextRequest): string {
    // 1. Try Next.js built-in IP (works on Vercel, etc.)
    const req = request as any;
    if (req.ip) {
        return req.ip;
    }

    // 2. Check headers
    const headers = request.headers;

    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
        // The first IP is the client IP
        return xForwardedFor.split(",")[0].trim();
    }

    const cfConnectingIp = headers.get("cf-connecting-ip");
    if (cfConnectingIp) {
        return cfConnectingIp;
    }

    const realIp = headers.get("x-real-ip");
    if (realIp) {
        return realIp;
    }

    // Fallback for local development
    return "127.0.0.1";
}
