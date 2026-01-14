import { SourceBreakdown } from "@/types/pulse";

interface SourcesBreakdownProps {
    breakdown: SourceBreakdown;
}

export function SourcesBreakdown({ breakdown }: SourcesBreakdownProps) {
    const hasReddit = breakdown.reddit.length > 0;
    const hasHN = breakdown.hackernews.length > 0;
    const hasGitHub = breakdown.github && breakdown.github.length > 0;
    const hasDevTo = breakdown.devto && breakdown.devto.length > 0;

    if (!hasReddit && !hasHN && !hasGitHub && !hasDevTo) {
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

                {/* GitHub */}
                {breakdown.github && breakdown.github.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-gray-100" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            <h4 className="text-sm font-medium text-gray-200">Top Repositories</h4>
                        </div>
                        <div className="space-y-2">
                            {breakdown.github.slice(0, 5).map((repo) => (
                                <div
                                    key={repo.name}
                                    className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                                >
                                    <a
                                        href={repo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/60 hover:text-white hover:underline underline-offset-2"
                                    >
                                        {repo.name}
                                    </a>
                                    <span className="text-white/30 tabular-nums">{repo.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Dev.to */}
                {hasDevTo && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-gray-100" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6v4.36h.58c.37 0 .65-.08.84-.23.18-.16.27-.48.27-.97v-1.92c0-.49-.09-.82-.27-.98zm-3.5 0c-.18-.16-.46-.23-.84-.23H2.5v4.36h.58c.37 0 .65-.08.84-.23.18-.16.27-.48.27-.97v-1.92c0-.49-.09-.82-.27-.98zM24 2.5v19c0 1.38-1.12 2.5-2.5 2.5h-19C1.12 24 0 22.88 0 21.5v-19C0 1.12 1.12 0 2.5 0h19C22.88 0 24 1.12 24 2.5zM8.56 15.8c.48-.55.72-1.37.72-2.45v-2.5c0-1.04-.24-1.83-.72-2.38-.48-.54-1.16-.81-2.04-.81H4.28v11.45h2.24c.88 0 1.56-.27 2.04-.81zm6.42-6.24c0-.58-.36-1.02-.86-1.02H11.8v8.08h2.26c.52 0 .86-.37.86-.88v-3.06h-1.68v-.96h1.68V9.56h.06zm7.5-.56h-1.14c-.57 0-1.04.2-1.39.58-.18.2-.31.44-.39.72-.08.28-.12.69-.12 1.22v1.2c0 1.44.52 2.42 1.56 2.94l-.04.02c.24.1.49.15.76.15h1.04v-.86h-.72c-.52 0-.84-.08-1-.25-.16-.16-.24-.45-.24-.86v-1.8h2.24V9.9h-2.24v-1.1h-1.08v1.1h-1.08v.86h1.08v2.76c0 .63.18 1.12.54 1.47.36.35.88.53 1.56.53h2.08v-6.1h-1.42v-.06z" />
                            </svg>
                            <h4 className="text-sm font-medium text-gray-200">Top Tags</h4>
                        </div>
                        <div className="space-y-2">
                            {breakdown.devto.slice(0, 5).map((item) => (
                                <div
                                    key={item.tag}
                                    className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                                >
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white/60 hover:text-white hover:underline underline-offset-2"
                                    >
                                        #{item.tag}
                                    </a>
                                    <span className="text-white/30 tabular-nums">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
