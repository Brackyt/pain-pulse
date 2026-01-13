import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase-admin";
import { PulseReport, PulseReportFirestore } from "@/types/pulse";
import { MetricCard } from "@/components/pulse/metric-card";
import { PainSpikes } from "@/components/pulse/pain-spikes";
import { ThemesList } from "@/components/pulse/themes-list";
import { QuotesSection } from "@/components/pulse/quotes-section";
import { BestQuotes } from "@/components/pulse/best-quotes";
import { BuildIdeas } from "@/components/pulse/build-ideas";
import { SourcesBreakdown } from "@/components/pulse/sources-breakdown";
import { ShareButtons } from "@/components/pulse/share-buttons";

interface PageProps {
    params: Promise<{ slug: string }>;
}

async function getReport(slug: string): Promise<PulseReport | null> {
    try {
        const docRef = db.collection("pulses").doc(slug);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data() as PulseReportFirestore;

        return {
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        };
    } catch (error) {
        console.error("Failed to fetch report:", error);
        return null;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const report = await getReport(slug);

    if (!report) {
        return {
            title: "Report Not Found | Pain Pulse",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://painpulse.app";
    const ogUrl = `${baseUrl}/api/og?slug=${slug}&query=${encodeURIComponent(report.query)}&pain=${report.stats.painIndex}&opportunity=${report.stats.opportunityScore}&volume=${report.stats.volume}`;

    return {
        title: `${report.query} - Pain Report | Pain Pulse`,
        description: `Pain analysis for "${report.query}": Pain Index ${report.stats.painIndex}/100, Opportunity Score ${report.stats.opportunityScore}/100, ${report.stats.volume} mentions.`,
        openGraph: {
            title: `${report.query} - Pain Report | Pain Pulse`,
            description: `Pain Index: ${report.stats.painIndex}/100 | Opportunity Score: ${report.stats.opportunityScore}/100`,
            images: [ogUrl],
        },
        twitter: {
            card: "summary_large_image",
            title: `${report.query} - Pain Report | Pain Pulse`,
            description: `Pain Index: ${report.stats.painIndex}/100 | Opportunity Score: ${report.stats.opportunityScore}/100`,
            images: [ogUrl],
        },
    };
}

export default async function PulsePage({ params }: PageProps) {
    const { slug } = await params;
    const report = await getReport(slug);

    if (!report) {
        notFound();
    }

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(report.updatedAt);

    return (
        <div className="pulse-gradient-bg pulse-pattern min-h-screen">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[#0f0f23]/80 backdrop-blur-lg border-b border-white/5 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white">
                        <span className="text-2xl">🔥</span>
                        <span className="text-xl font-bold tracking-tight">Pain Pulse</span>
                    </Link>
                    <Link
                        href="/"
                        className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Report
                    </Link>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-white/5 border border-white/10 rounded-full text-sm text-white/60">
                        <span>Last updated: {formattedDate}</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                        Pain Report:{" "}
                        <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent capitalize">
                            {report.query}
                        </span>
                    </h1>

                    <p className="text-lg text-white/50 max-w-2xl mx-auto">
                        Analysis of {report.stats.volume} posts from the last {report.windowDays} days
                    </p>
                </header>

                {/* Share Buttons */}
                <div className="flex justify-center mb-12">
                    <ShareButtons report={report} />
                </div>

                {/* Big Metrics */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <MetricCard
                        value={report.stats.painIndex}
                        label="Pain Index"
                        color="red"
                        suffix="/100"
                    />
                    <MetricCard
                        value={report.stats.opportunityScore}
                        label="Opportunity Score"
                        color="green"
                        suffix="/100"
                    />
                    <MetricCard
                        value={report.stats.volume}
                        label="Total Mentions"
                        color="blue"
                        trend={report.painSpikes.deltaPercent}
                    />
                </section>

                {/* Pain Spikes */}
                <section className="mb-12">
                    <PainSpikes spikes={report.painSpikes} />
                </section>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Pain Themes */}
                    <ThemesList themes={report.themes} />

                    {/* Top Phrases */}
                    <QuotesSection phrases={report.topPhrases} />
                </div>

                {/* Best Quotes from Comments */}
                {report.bestQuotes && report.bestQuotes.length > 0 && (
                    <section className="mb-12">
                        <BestQuotes quotes={report.bestQuotes} />
                    </section>
                )}

                {/* Build Ideas */}
                <section className="mb-12">
                    <BuildIdeas ideas={report.buildIdeas} />
                </section>

                {/* Sources Breakdown */}
                <section className="mb-12">
                    <SourcesBreakdown breakdown={report.sourceBreakdown} />
                </section>

                {/* CTA */}
                <section className="text-center py-12 border-t border-white/5">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Ready to explore another market?
                    </h2>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200"
                    >
                        Generate New Report
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 px-6 py-8">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
                    <div className="flex items-center gap-2">
                        <span>🔥</span>
                        <span>Pain Pulse</span>
                    </div>
                    <div>Built for makers who solve real problems.</div>
                </div>
            </footer>
        </div>
    );
}
