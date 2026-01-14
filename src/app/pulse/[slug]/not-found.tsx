import Link from "next/link";

export default function NotFound() {
    return (
        <div className="pulse-gradient-bg pulse-pattern min-h-screen flex items-center justify-center px-6">
            <div className="text-center">
                <div className="text-6xl mb-6">🔍</div>
                <h1 className="text-4xl font-bold text-white mb-4">Report Not Found</h1>
                <p className="text-lg text-white/50 mb-8">
                    This pain report doesn&apos;t exist yet. Generate a new one!
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-200"
                >
                    Generate Report
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}
