import { PainSpike } from "@/types/pulse";

interface PainSpikesProps {
    spikes: PainSpike;
}

export function PainSpikes({ spikes }: PainSpikesProps) {
    const { weeklyVolume, monthlyVolume, deltaPercent } = spikes;
    const weeklyPercent = monthlyVolume > 0 ? (weeklyVolume / monthlyVolume) * 100 : 0;

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span>🔥</span> Pain Spikes
            </h3>

            <div className="space-y-6">
                {/* Weekly vs Monthly comparison */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">This Week</span>
                        <span className="text-white font-medium">{weeklyVolume} posts</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(weeklyPercent * 4, 100)}%` }}
                        />
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/60">This Month</span>
                        <span className="text-white font-medium">{monthlyVolume} posts</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Delta */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-white/60 text-sm">Week over Week Change</span>
                    <div
                        className={`flex items-center gap-1 text-lg font-bold ${deltaPercent > 0
                                ? "text-red-400"
                                : deltaPercent < 0
                                    ? "text-emerald-400"
                                    : "text-white/40"
                            }`}
                    >
                        {deltaPercent > 0 ? "↑" : deltaPercent < 0 ? "↓" : "→"}
                        <span>{Math.abs(deltaPercent)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
