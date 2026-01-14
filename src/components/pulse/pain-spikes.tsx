import { PainSpike } from "@/types/pulse";
import { TrendingIcon } from "@/components/ui/icons";

interface PainSpikesProps {
    spikes: PainSpike;
}

export function PainSpikes({ spikes }: PainSpikesProps) {
    const { weeklyVolume, monthlyVolume, deltaPercent } = spikes;
    const weeklyPercent = monthlyVolume > 0 ? (weeklyVolume / monthlyVolume) * 100 : 0;

    return (
        <div className="pulse-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                    <TrendingIcon size={20} className="text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Pain Spikes</h3>
            </div>

            <div className="space-y-5">
                {/* Weekly */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/50">This Week</span>
                        <span className="text-white font-medium tabular-nums">{weeklyVolume} posts</span>
                    </div>
                    <div className="heat-bar heat-bar-pain">
                        <div
                            className="heat-bar-fill"
                            style={{ width: `${Math.min(weeklyPercent * 4, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Monthly */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/50">This Month</span>
                        <span className="text-white font-medium tabular-nums">{monthlyVolume} posts</span>
                    </div>
                    <div className="heat-bar heat-bar-cool">
                        <div
                            className="heat-bar-fill"
                            style={{ width: "100%" }}
                        />
                    </div>
                </div>

                {/* Delta */}
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-white/40 text-sm">Week over Week</span>
                    <div
                        className={`flex items-center gap-1.5 text-lg font-bold ${deltaPercent > 0
                                ? "text-red-400"
                                : deltaPercent < 0
                                    ? "text-emerald-400"
                                    : "text-white/30"
                            }`}
                    >
                        <span className="text-2xl">
                            {deltaPercent > 0 ? "↑" : deltaPercent < 0 ? "↓" : "→"}
                        </span>
                        <span className="tabular-nums">{Math.abs(deltaPercent)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
