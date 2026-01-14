import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase-admin";
import { PulseReport, PulseReportFirestore } from "@/types/pulse";
import { MetricCard } from "@/components/pulse/metric-card";
import { PainSpikes } from "@/components/pulse/pain-spikes";
import { FrictionsList } from "@/components/pulse/frictions-list";
import { ThemesList } from "@/components/pulse/themes-list";
import { QuotesSection } from "@/components/pulse/quotes-section";
import { BestQuotes } from "@/components/pulse/best-quotes";
import { BuildIdeas } from "@/components/pulse/build-ideas";
import { SourcesBreakdown } from "@/components/pulse/sources-breakdown";
import { ShareButtons } from "@/components/pulse/share-buttons";
import { PulseIcon } from "@/components/ui/icons";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface PageProps {
    params: Promise<{ slug: string }>;
}

import { cache } from 'react';

const getReport = cache(async (slug: string): Promise<PulseReport | null> => {
    try {
        const docRef = db.collection("pulses").doc(slug);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data() as PulseReportFirestore;

        // Validating date function safely
        const toDate = (val: number | { toDate?: () => Date }): Date => {
            if (typeof val === 'number') return new Date(val);
            if (val && typeof val.toDate === 'function') return val.toDate();
            return new Date();
        };

        return {
            ...data,
            createdAt: toDate(data.createdAt),
            updatedAt: toDate(data.updatedAt),
        };
    } catch (error) {
        console.error("Failed to fetch report:", error);
        return null;
    }
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const report = await getReport(slug);

    if (!report) {
        return {
            title: "Report Not Found | Pain Pulse",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pain-pulse.web.app";
    const ogUrl = `${baseUrl}/api/og?slug=${slug}&query=${encodeURIComponent(report.query)}&pain=${report.stats.painIndex}&opportunity=${report.stats.opportunityScore}&volume=${report.stats.volume}`;

    return {
        title: `${report.query} - Pain Report | Pain Pulse`,
        description: `Pain analysis for "${report.query}": Pain Index ${report.stats.painIndex}/100, Opportunity Score ${report.stats.opportunityScore}/100, ${report.stats.volume} mentions.`,
        openGraph: {
            title: `${report.query} - Pain Report | Pain Pulse`,
            description: `Pain Index: ${report.stats.painIndex}/100 | Opportunity Score: ${report.stats.opportunityScore}/100`,
            images: [
                {
                    url: ogUrl,
                    width: 1200,
                    height: 630,
                    alt: `Pain Report for ${report.query}`,
                },
            ],
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
        <AuroraBackground intensity="medium">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-3">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 text-white group">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
                            <PulseIcon size={18} className="text-red-400" />
                        </div>
                        <span className="text-lg font-bold tracking-tight">Pain Pulse</span>
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Report
                    </Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* Header */}
                <ScrollReveal>
                    <header className="text-center mb-10">
                        <div className="pulse-chip mb-6 inline-flex">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Updated {formattedDate}</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
                            Pain Report:{" "}
                            <span className="text-gradient-warm capitalize">
                                {report.query}
                            </span>
                        </h1>

                        <p className="text-base text-white/40 max-w-lg mx-auto">
                            Analysis of {report.stats.volume} posts from the last {report.windowDays} days
                        </p>
                    </header>
                </ScrollReveal>

                {/* Share Buttons */}
                <ScrollReveal delay={100}>
                    <div className="flex justify-center mb-10">
                        <ShareButtons report={report} />
                    </div>
                </ScrollReveal>

                {/* Big Metrics - Bento Style */}
                <ScrollReveal delay={200}>
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <MetricCard
                            value={report.stats.painIndex}
                            label="Pain Index"
                            type="pain"
                            suffix="/100"
                        />
                        <MetricCard
                            value={report.stats.opportunityScore}
                            label="Opportunity Score"
                            type="opportunity"
                            suffix="/100"
                        />
                        <MetricCard
                            value={report.stats.volume}
                            label="Total Mentions"
                            type="volume"
                            trend={report.painSpikes.deltaPercent}
                        />
                    </section>
                </ScrollReveal>

                {/* Top Frictions */}
                <section className="mb-8">
                    <FrictionsList frictions={report.frictions || []} />
                </section>

                {/* Pain Spikes */}
                <section className="mb-8">
                    <PainSpikes spikes={report.painSpikes} />
                </section>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <ThemesList themes={report.themes} />
                    <QuotesSection phrases={report.topPhrases} />
                </div>

                {/* Pain Receipts */}
                {report.painReceipts && report.painReceipts.length > 0 && (
                    <section className="mb-8">
                        <BestQuotes quotes={report.painReceipts} />
                    </section>
                )}

                {/* Build Ideas */}
                <section className="mb-8">
                    <BuildIdeas ideas={report.buildIdeas} />
                </section>

                {/* Sources Breakdown */}
                <section className="mb-8">
                    <SourcesBreakdown breakdown={report.sourceBreakdown} />
                </section>

                {/* CTA */}
                <ScrollReveal>
                    <section className="text-center py-12 border-t border-white/5">
                        <h2 className="text-xl font-semibold text-white mb-4">
                            Explore another market?
                        </h2>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-red-500/25 hover:shadow-red-500/40 hover:scale-105"
                        >
                            Generate New Report
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </Link>
                    </section>
                </ScrollReveal>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 px-6 py-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
                    <div className="flex items-center gap-2">
                        <PulseIcon size={14} className="text-red-400/60" />
                        <span>Pain Pulse</span>
                    </div>
                    <div>Built for makers who solve real problems.</div>
                </div>
            </footer>
        </AuroraBackground>
    );
}
