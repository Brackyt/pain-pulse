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
        <div className="pulse-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Sources</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Reddit */}
                {hasReddit && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                            </svg>
                            <h4 className="text-sm font-medium text-orange-400">Top Subreddits</h4>
                        </div>
                        <div className="space-y-2">
                            {breakdown.reddit.slice(0, 5).map((sub) => (
                                <div
                                    key={sub.subreddit}
                                    className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                                >
                                    <a
                                        href={`https://reddit.com/r/${sub.subreddit}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/60 hover:text-white hover:underline underline-offset-2"
                                    >
                                        r/{sub.subreddit}
                                    </a>
                                    <span className="text-white/30 tabular-nums">{sub.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hacker News */}
                {hasHN && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-4 h-4 bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center rounded">Y</span>
                            <h4 className="text-sm font-medium text-orange-400">Top HN Threads</h4>
                        </div>
                        <div className="space-y-2">
                            {breakdown.hackernews.slice(0, 5).map((thread, index) => (
                                <div key={index} className="text-sm p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                                    <a
                                        href={thread.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/60 hover:text-white hover:underline underline-offset-2 line-clamp-1"
                                    >
                                        {thread.title}
                                    </a>
                                    <span className="text-white/30 text-xs ml-2 tabular-nums">
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
