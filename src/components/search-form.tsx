"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EXAMPLE_KEYWORDS = [
    "notion alternative",
    "email automation",
    "project management tool",
    "time tracking",
    "password manager",
    "note taking app",
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
        <div className="w-full max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-orange-500/20 to-yellow-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
                    <div className="relative flex gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2">
                        <Input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Enter a keyword (e.g., invoice, CRM, email...)"
                            className="flex-1 bg-transparent border-0 text-lg text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 h-14 px-4"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="h-14 px-8 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                                    Analyzing...
                                </span>
                            ) : (
                                "Get Pain Report"
                            )}
                        </Button>
                    </div>
                </div>
            </form>

            {error && (
                <p className="mt-4 text-center text-red-400 text-sm">{error}</p>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-2">
                <span className="text-white/40 text-sm mr-2">Try:</span>
                {EXAMPLE_KEYWORDS.map((keyword) => (
                    <button
                        key={keyword}
                        onClick={() => handleExampleClick(keyword)}
                        className="px-4 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/70 hover:text-white transition-all duration-200"
                    >
                        {keyword}
                    </button>
                ))}
            </div>
        </div>
    );
}
