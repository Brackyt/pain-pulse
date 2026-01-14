"use client";

import { useState, useEffect } from "react";
import { SearchForm } from "@/components/search-form";
import { PulseIcon, PainGaugeIcon, TargetIcon, QuoteIcon } from "@/components/ui/icons";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { AnimatedNumber } from "@/components/ui/animated-number";
import Link from "next/link";

export default function Home() {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      // Hide scroll indicator after scrolling 100px
      setShowScrollIndicator(window.scrollY < 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AuroraBackground intensity="strong">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-white group">
            <div className="relative">
              {/* Animated pulse ring */}
              <div className="absolute inset-0 -m-1 rounded-lg bg-red-500/20 animate-pulse-ring" />
              <div className="relative p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
                <PulseIcon size={20} className="text-red-400" />
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight">Pain Pulse</span>
          </Link>
          <a
            href="https://x.com/lebrackyt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            By Brackyt
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-6 py-24">
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Live indicator */}
          <ScrollReveal delay={0}>
            <div className="pulse-chip mb-8 inline-flex">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
              <span>Real-time frustration analysis</span>
            </div>
          </ScrollReveal>

          {/* Headline */}
          <ScrollReveal delay={100}>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
              Internet{" "}
              <span className="text-gradient-warm">
                Frustration
              </span>
              <br />
              Barometer
            </h1>
          </ScrollReveal>

          {/* Subheadline */}
          <ScrollReveal delay={200}>
            <p className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
              Discover what people are{" "}
              <span className="text-red-400/90">complaining about</span>,{" "}
              <span className="text-orange-400/90">asking for</span>, and{" "}
              <span className="text-amber-400/90">struggling with</span> on Reddit,
              Hacker News, GitHub & Dev.to.
            </p>
          </ScrollReveal>

          {/* Search Form */}
          <ScrollReveal delay={300}>
            <SearchForm />
          </ScrollReveal>

          {/* Stats */}
          <ScrollReveal delay={400}>
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center group">
                <div className="text-3xl font-bold text-white mb-1 tabular-nums group-hover:text-red-400 transition-colors">
                  <AnimatedNumber value={100} suffix="+" duration={1500} />
                </div>
                <div className="text-sm text-white/40">Sources per query</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-white mb-1 tabular-nums group-hover:text-orange-400 transition-colors">
                  24/7
                </div>
                <div className="text-sm text-white/40">Always fresh data</div>
              </div>
              <div className="text-center group">
                <div className="text-3xl font-bold text-white mb-1 group-hover:text-emerald-400 transition-colors">
                  Free
                </div>
                <div className="text-sm text-white/40">No signup required</div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Scroll indicator - positioned at bottom of hero, fades on scroll */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-500 ease-out"
          style={{ opacity: showScrollIndicator ? 1 : 0 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-white/40 animate-bounce" />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
              What you&apos;ll discover
            </h2>
            <p className="text-white/40 text-center mb-16 max-w-lg mx-auto">
              Turn internet complaints into actionable market insights
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delay={100}>
              <div className="pulse-card p-6 group h-full hover:translate-y-[-4px] transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red-500/20 transition-all">
                  <PainGaugeIcon size={24} className="text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Pain Index</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Quantified frustration score from sentiment analysis and engagement metrics.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="pulse-card p-6 group h-full hover:translate-y-[-4px] transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all">
                  <TargetIcon size={24} className="text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Opportunity Score</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Startup potential calculated from buyer intent signals and market trends.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="pulse-card p-6 group h-full hover:translate-y-[-4px] transition-transform duration-300">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all">
                  <QuoteIcon size={24} className="text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Raw Receipts</h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  Actual quotes and complaints you can use for copywriting and validation.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <PulseIcon size={16} className="text-red-400/60" />
            <span>Pain Pulse</span>
          </div>
          <div>Built for makers who solve real problems.</div>
        </div>
      </footer>
    </AuroraBackground>
  );
}
