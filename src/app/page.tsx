import { SearchForm } from "@/components/search-form";
import Link from "next/link";

export default function Home() {
  return (
    <div className="pulse-gradient-bg pulse-pattern min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-2xl">🔥</span>
            <span className="text-xl font-bold tracking-tight">Pain Pulse</span>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white text-sm transition-colors"
          >
            Open Source
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-6 py-24">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse-glow delay-1000" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/5 border border-white/10 rounded-full text-sm text-white/70">
            <span className="animate-pulse">🔴</span>
            Real-time frustration analysis
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Internet{" "}
            <span className="bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              Frustration
            </span>
            <br />
            Barometer
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover what people are{" "}
            <span className="text-red-400">complaining about</span>,{" "}
            <span className="text-orange-400">asking for</span>, and{" "}
            <span className="text-yellow-400">struggling with</span> on Reddit &
            Hacker News.
          </p>

          {/* Search Form */}
          <SearchForm />

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">100+</div>
              <div className="text-sm text-white/40">Sources analyzed per query</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-sm text-white/40">Fresh data, always cached</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">Free</div>
              <div className="text-sm text-white/40">No signup required</div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg
            className="w-6 h-6 text-white/30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            What you'll discover
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Pain Index</h3>
              <p className="text-white/50">
                Quantified frustration score based on sentiment analysis and engagement metrics.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
              <div className="text-4xl mb-4">💡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Opportunity Score</h3>
              <p className="text-white/50">
                Startup potential calculated from buyer intent signals and market trends.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-white mb-2">Raw Receipts</h3>
              <p className="text-white/50">
                Actual quotes and complaints you can use for copywriting and validation.
              </p>
            </div>
          </div>
        </div>
      </section>

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
