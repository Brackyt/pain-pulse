import { SearchForm } from "@/components/search-form";
import { PulseIcon, PainGaugeIcon, TargetIcon, QuoteIcon } from "@/components/ui/icons";
import Link from "next/link";

export default function Home() {
  return (
    <div className="pulse-gradient-bg pulse-pattern min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
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
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white text-sm transition-colors"
          >
            Open Source
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-6 py-24">
        {/* Background decoration - subtle warm glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-red-500/[0.07] to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Live indicator */}
          <div className="pulse-chip mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-live-pulse" />
            <span>Real-time frustration analysis</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Internet{" "}
            <span className="text-gradient-warm">
              Frustration
            </span>
            <br />
            Barometer
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover what people are{" "}
            <span className="text-red-400/90">complaining about</span>,{" "}
            <span className="text-orange-400/90">asking for</span>, and{" "}
            <span className="text-amber-400/90">struggling with</span> on Reddit &
            Hacker News.
          </p>

          {/* Search Form */}
          <SearchForm />

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1 tabular-nums">100+</div>
              <div className="text-sm text-white/40">Sources per query</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1 tabular-nums">24/7</div>
              <div className="text-sm text-white/40">Always fresh data</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">Free</div>
              <div className="text-sm text-white/40">No signup required</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1 h-2 rounded-full bg-white/40 animate-bounce" />
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-4">
            What you'll discover
          </h2>
          <p className="text-white/40 text-center mb-16 max-w-lg mx-auto">
            Turn internet complaints into actionable market insights
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="pulse-card p-6 group">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <PainGaugeIcon size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Pain Index</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Quantified frustration score from sentiment analysis and engagement metrics.
              </p>
            </div>

            <div className="pulse-card p-6 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <TargetIcon size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Opportunity Score</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Startup potential calculated from buyer intent signals and market trends.
              </p>
            </div>

            <div className="pulse-card p-6 group">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <QuoteIcon size={24} className="text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Raw Receipts</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Actual quotes and complaints you can use for copywriting and validation.
              </p>
            </div>
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
    </div>
  );
}
