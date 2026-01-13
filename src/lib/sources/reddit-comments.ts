import { RawPost } from "@/types/pulse";

const USER_AGENT = "PainPulse/1.0 (Market Research Tool)";

export interface RedditComment {
    id: string;
    body: string;
    score: number;
    author: string;
    postId: string;
    postTitle: string;
}

interface RedditCommentData {
    data: {
        id: string;
        body: string;
        score: number;
        author: string;
        replies?: {
            data?: {
                children?: RedditCommentData[];
            };
        };
    };
}

interface RedditCommentsResponse {
    data: {
        children: RedditCommentData[];
    };
}

/**
 * Fetch top comments for a Reddit post
 */
async function fetchPostComments(
    postId: string,
    postTitle: string,
    limit: number = 10
): Promise<RedditComment[]> {
    const url = `https://www.reddit.com/comments/${postId}.json?limit=${limit}&sort=top`;

    try {
        const response = await fetch(url, {
            headers: {
                "User-Agent": USER_AGENT,
            },
        });

        if (!response.ok) {
            return [];
        }

        const data: RedditCommentsResponse[] = await response.json();

        // Comments are in the second element
        if (!data[1]?.data?.children) {
            return [];
        }

        const comments: RedditComment[] = [];

        for (const child of data[1].data.children) {
            if (child.data.body && child.data.body !== "[deleted]" && child.data.body !== "[removed]") {
                comments.push({
                    id: child.data.id,
                    body: child.data.body,
                    score: child.data.score,
                    author: child.data.author,
                    postId,
                    postTitle,
                });
            }
        }

        return comments;
    } catch (error) {
        console.error(`Failed to fetch comments for ${postId}:`, error);
        return [];
    }
}

/**
 * Check if a comment contains pain/intent signals
 */
function hasPainOrIntentSignal(text: string): boolean {
    const lowerText = text.toLowerCase();

    const signals = [
        "i wish", "why is", "why does", "why do", "can't", "cannot", "won't",
        "hate", "frustrat", "annoying", "terrible", "awful", "worst",
        "alternative", "recommend", "looking for", "is there a", "any good",
        "too expensive", "overpriced", "pricing", "switched from", "switching to",
        "problem with", "issue with", "doesn't work", "broken", "useless",
    ];

    return signals.some((signal) => lowerText.includes(signal));
}

/**
 * Check if a comment is a good one-liner quote
 */
function isGoodQuote(text: string): boolean {
    // Clean up markdown and check length
    const cleaned = text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove markdown links
        .replace(/[*_~`#]/g, "") // Remove markdown formatting
        .replace(/\n+/g, " ") // Replace newlines with spaces
        .trim();

    // Ideal length: 10-50 words
    const wordCount = cleaned.split(/\s+/).length;
    if (wordCount < 8 || wordCount > 60) return false;

    // Must have pain/intent signal
    if (!hasPainOrIntentSignal(cleaned)) return false;

    return true;
}

/**
 * Clean up a comment for display
 */
function cleanQuote(text: string): string {
    return text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[*_~`#]/g, "")
        .replace(/\n+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);
}

/**
 * Fetch top comments from the best Reddit posts to get real "receipts"
 */
export async function fetchBestQuotes(
    posts: RawPost[],
    maxPosts: number = 15,
    maxQuotes: number = 15
): Promise<string[]> {
    // Only Reddit posts
    const redditPosts = posts
        .filter((p) => p.source === "reddit")
        .sort((a, b) => (b.score + b.comments * 2) - (a.score + a.comments * 2))
        .slice(0, maxPosts);

    if (redditPosts.length === 0) {
        return [];
    }

    const allQuotes: { quote: string; score: number }[] = [];

    // Fetch comments for top posts (with delays to avoid rate limiting)
    for (let i = 0; i < redditPosts.length; i++) {
        const post = redditPosts[i];

        if (i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
        }

        const comments = await fetchPostComments(post.id, post.title, 15);

        for (const comment of comments) {
            if (isGoodQuote(comment.body)) {
                allQuotes.push({
                    quote: cleanQuote(comment.body),
                    score: comment.score,
                });
            }
        }
    }

    // Sort by score and deduplicate
    const seen = new Set<string>();
    const uniqueQuotes = allQuotes
        .sort((a, b) => b.score - a.score)
        .filter((q) => {
            const key = q.quote.slice(0, 50).toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, maxQuotes)
        .map((q) => q.quote);

    console.log(`Extracted ${uniqueQuotes.length} quality quotes from comments`);

    return uniqueQuotes;
}
