"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXAMPLE_KEYWORDS = [
    "notion alternative",
    "email automation",
    "CRM tool",
    "time tracking",
    "password manager",
];

export function SearchForm() {
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/pulse", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to generate report");
                setLoading(false);
                return;
            }

            router.push(`/pulse/${data.slug}`);
        } catch (err) {
            setError("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const handleExampleClick = (keyword: string) => {
        setQuery(keyword);
    };

    return (
        <div className="w-full max-w-xl mx-auto px-4 sm:px-0">
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative group">
                    {/* Subtle glow on focus */}
                    <div className="absolute -inset-px bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                    {/* Stack on mobile, side-by-side on larger screens */}
                    <div className="relative flex flex-col sm:flex-row gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2 group-focus-within:border-white/20 transition-colors">
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter a keyword..."
                            className="flex-1 bg-transparent border-0 text-base text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:ring-offset-0 px-4"
                            style={{ minHeight: '56px' }}
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            disabled={loading || !query.trim()}
                            style={{ minHeight: '56px' }}
                            className="px-6 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-red-500/20 w-full sm:w-auto"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            fill="none"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                    <span>Analyzing...</span>
                                </span>
                            ) : (
                                "Get Report"
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            {error && (
                <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2">
                <span className="text-white/30 text-sm mr-1">Try:</span>
                {EXAMPLE_KEYWORDS.map((keyword) => (
                    <button
                        key={keyword}
                        onClick={() => handleExampleClick(keyword)}
                        className="pulse-tag text-sm"
                    >
                        {keyword}
                    </button>
                ))}
            </div>
        </div>
    );
}
