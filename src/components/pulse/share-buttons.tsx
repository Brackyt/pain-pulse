"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PulseReport } from "@/types/pulse";

interface ShareButtonsProps {
    report: PulseReport;
}

export function ShareButtons({ report }: ShareButtonsProps) {
    const [copied, setCopied] = useState<"link" | "tweet" | null>(null);

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const shareUrl = `${baseUrl}/pulse/${report.slug}`;

    const tweetText = `🔥 Pain Pulse for "${report.query}"

📊 Pain Index: ${report.stats.painIndex}/100
💡 Opportunity Score: ${report.stats.opportunityScore}/100
📈 ${report.stats.volume} mentions this week

${shareUrl}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied("link");
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleCopyTweet = async () => {
        try {
            await navigator.clipboard.writeText(tweetText);
            setCopied("tweet");
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const handleTweet = () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterUrl, "_blank");
    };

    return (
        <div className="flex flex-wrap gap-3">
            <Button
                onClick={handleCopyLink}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
                {copied === "link" ? (
                    <>
                        <svg
                            className="w-4 h-4 mr-2 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        Copied!
                    </>
                ) : (
                    <>
                        <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                            />
                        </svg>
                        Copy Link
                    </>
                )}
            </Button>

            <Button
                onClick={handleCopyTweet}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
            >
                {copied === "tweet" ? (
                    <>
                        <svg
                            className="w-4 h-4 mr-2 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                        Copied!
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Copy Tweet
                    </>
                )}
            </Button>

            <Button
                onClick={handleTweet}
                className="bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white"
            >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Share on X
            </Button>
        </div>
    );
}
