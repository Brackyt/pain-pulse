"use client";

import { PainSpike } from "@/types/pulse";
import { TrendingIcon } from "@/components/ui/icons";
import { Sparkline } from "@/components/ui/sparkline";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface PainSpikesProps {
    spikes: PainSpike;
}

export function PainSpikes({ spikes }: PainSpikesProps) {
    const { weeklyVolume, monthlyVolume, deltaPercent } = spikes;
    const weeklyPercent = monthlyVolume > 0 ? (weeklyVolume / monthlyVolume) * 100 : 0;

    // Generate mock trend data for sparkline (you can replace with real data)
    const trendData = generateTrendData(monthlyVolume, weeklyVolume);

    return (
        <ScrollReveal>
            <div className="pulse-card p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                        <TrendingIcon size={20} className="text-orange-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">Pain Spikes</h3>
                    </div>
                    {/* Mini sparkline in header */}
                    <div className="hidden sm:block">
                        <Sparkline
                            data={trendData}
                            width={80}
                            height={28}
                            gradientFrom="#f97316"
                            gradientTo="#ef4444"
                            strokeWidth={2}
                        />
                    </div>
                </div>

                <div className="space-y-5">
                    {/* Weekly */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/50">This Week</span>
                            <span className="text-white font-medium tabular-nums">
                                <AnimatedNumber value={weeklyVolume} duration={1000} /> posts
                            </span>
                        </div>
                        <div className="heat-bar heat-bar-pain h-3 rounded-lg">
                            <div
                                className="heat-bar-fill rounded-lg"
                                style={{ width: `${Math.min(weeklyPercent * 4, 100)}%` }}
                            />
                        </div>
                    </div>

                    {/* Monthly */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-white/50">This Month</span>
                            <span className="text-white font-medium tabular-nums">
                                <AnimatedNumber value={monthlyVolume} duration={1000} delay={200} /> posts
                            </span>
                        </div>
                        <div className="heat-bar heat-bar-cool h-3 rounded-lg">
                            <div
                                className="heat-bar-fill rounded-lg"
                                style={{ width: "100%" }}
                            />
                        </div>
                    </div>

                    {/* Delta with enhanced styling */}
                    <div className="flex items-center justify-between pt-5 border-t border-white/5">
                        <span className="text-white/40 text-sm">Week over Week</span>
                        <div
                            className={`flex items-center gap-2 text-lg font-bold px-3 py-1.5 rounded-xl ${deltaPercent > 0
                                ? "text-red-400 bg-red-500/10"
                                : deltaPercent < 0
                                    ? "text-emerald-400 bg-emerald-500/10"
                                    : "text-white/30 bg-white/5"
                                }`}
                        >
                            <span className="text-2xl">
                                {deltaPercent > 0 ? "↑" : deltaPercent < 0 ? "↓" : "→"}
                            </span>
                            <span className="tabular-nums">
                                <AnimatedNumber value={Math.abs(deltaPercent)} duration={1200} delay={400} />%
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </ScrollReveal>
    );
}

// Helper to generate trend visualization data (deterministic for SSR)
function generateTrendData(monthlyVolume: number, weeklyVolume: number): number[] {
    const points = 8;
    const data: number[] = [];
    const baseValue = monthlyVolume / 4;

    // Use deterministic variations based on index + volume seed
    // This ensures same values on server and client
    const seed = monthlyVolume + weeklyVolume;
    const variations = [0.15, -0.1, 0.05, -0.15, 0.2, -0.05, 0.1];

    for (let i = 0; i < points - 1; i++) {
        const variation = variations[i % variations.length] * ((seed % 10) / 10 + 0.5);
        data.push(Math.max(1, Math.round(baseValue * (1 + variation))));
    }

    // Last point is the weekly volume
    data.push(weeklyVolume);

    return data;
}
