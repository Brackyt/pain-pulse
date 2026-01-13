import { Theme } from "@/types/pulse";
import { Badge } from "@/components/ui/badge";

interface ThemesListProps {
    themes: Theme[];
}

export function ThemesList({ themes }: ThemesListProps) {
    if (themes.length === 0) {
        return (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Pain Themes</h3>
                <p className="text-white/40">No distinct themes detected.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span>📊</span> Pain Themes (Ranked)
            </h3>

            <div className="space-y-6">
                {themes.map((theme, index) => (
                    <div
                        key={theme.title}
                        className="relative pl-8 border-l-2 border-white/10 hover:border-white/30 transition-colors"
                    >
                        {/* Rank badge */}
                        <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                            {index + 1}
                        </div>

                        {/* Theme content */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <h4 className="text-white font-medium">{theme.title}</h4>
                                <Badge
                                    variant="outline"
                                    className="text-orange-400 border-orange-400/30 text-xs"
                                >
                                    {theme.share}% of mentions
                                </Badge>
                            </div>

                            {/* Quotes */}
                            {theme.quotes.length > 0 && (
                                <div className="space-y-2">
                                    {theme.quotes.slice(0, 2).map((quote, i) => (
                                        <p
                                            key={i}
                                            className="text-sm text-white/50 italic border-l-2 border-white/10 pl-3"
                                        >
                                            "{quote}"
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Sources */}
                            {theme.sources.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {theme.sources.slice(0, 3).map((source, i) => (
                                        <a
                                            key={i}
                                            href={source.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-sky-400 hover:text-sky-300 hover:underline underline-offset-2"
                                        >
                                            {source.source === "reddit" ? "r/" : ""}
                                            {source.title.slice(0, 30)}...
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
