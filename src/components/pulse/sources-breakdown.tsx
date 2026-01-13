import { SourceBreakdown } from "@/types/pulse";

interface SourcesBreakdownProps {
    breakdown: SourceBreakdown;
}

export function SourcesBreakdown({ breakdown }: SourcesBreakdownProps) {
    const hasReddit = breakdown.reddit.length > 0;
    const hasHN = breakdown.hackernews.length > 0;

    if (!hasReddit && !hasHN) {
        return null;
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span>📍</span> Sources Breakdown
            </h3>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Reddit */}
                {hasReddit && (
                    <div>
                        <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                            </svg>
                            Top Subreddits
                        </h4>
                        <div className="space-y-2">
                            {breakdown.reddit.slice(0, 5).map((sub) => (
                                <div
                                    key={sub.subreddit}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <a
                                        href={`https://reddit.com/r/${sub.subreddit}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/70 hover:text-white hover:underline underline-offset-2"
                                    >
                                        r/{sub.subreddit}
                                    </a>
                                    <span className="text-white/40">{sub.count} posts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hacker News */}
                {hasHN && (
                    <div>
                        <h4 className="text-sm font-medium text-orange-400 mb-3 flex items-center gap-2">
                            <span className="font-bold">Y</span>
                            Top HN Threads
                        </h4>
                        <div className="space-y-2">
                            {breakdown.hackernews.slice(0, 5).map((thread, index) => (
                                <div key={index} className="text-sm">
                                    <a
                                        href={thread.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/70 hover:text-white hover:underline underline-offset-2 line-clamp-1"
                                    >
                                        {thread.title}
                                    </a>
                                    <span className="text-white/40 text-xs ml-2">
                                        {thread.points} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
