import { Theme } from "@/types/pulse";
import { Badge } from "@/components/ui/badge";

interface ThemesListProps {
    themes: Theme[];
}

export function ThemesList({ themes }: ThemesListProps) {
    if (themes.length === 0) {
        return (
            <div className="pulse-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Pain Themes</h3>
                <p className="text-white/40">No distinct themes detected.</p>
            </div>
        );
    }

    return (
        <div className="pulse-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Pain Themes</h3>
            </div>

            <div className="space-y-5">
                {themes.map((theme, index) => (
                    <div
                        key={`${index}-${theme.title}`}
                        className="relative"
                    >
                        {/* Theme header */}
                        <div className="flex items-center gap-3 mb-3">
                            <span className="shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-300">
                                {index + 1}
                            </span>
                            <h4 className="text-white font-medium flex-1 truncate">{theme.title}</h4>
                            <Badge
                                variant="outline"
                                className="text-violet-400 border-violet-400/20 bg-violet-500/5 text-xs shrink-0"
                            >
                                {theme.share}%
                            </Badge>
                        </div>

                        {/* Quotes */}
                        {theme.quotes.length > 0 && (
                            <div className="ml-10 space-y-2 mb-3">
                                {theme.quotes.slice(0, 2).map((quote, i) => (
                                    <p
                                        key={i}
                                        className="pull-quote text-sm text-white/50 py-1 not-italic"
                                    >
                                        "{quote}"
                                    </p>
                                ))}
                            </div>
                        )}

                        {/* Sources */}
                        {theme.sources.length > 0 && (
                            <div className="ml-10 flex flex-wrap gap-2">
                                {theme.sources.slice(0, 3).map((source, i) => (
                                    <a
                                        key={i}
                                        href={source.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-sky-400/70 hover:text-sky-400 hover:underline underline-offset-2"
                                    >
                                        {source.source === "reddit" ? "r/" : ""}
                                        {source.title.slice(0, 25)}...
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
