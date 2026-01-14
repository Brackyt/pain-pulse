import { PainGaugeIcon, TargetIcon, VolumeIcon } from "@/components/ui/icons";

interface MetricCardProps {
    value: number;
    label: string;
    type: "pain" | "opportunity" | "volume";
    suffix?: string;
    trend?: number;
}

const typeConfig = {
    pain: {
        icon: PainGaugeIcon,
        color: "text-red-400",
        bgClass: "metric-card-pain",
        iconBg: "bg-red-500/10 border-red-500/20",
    },
    opportunity: {
        icon: TargetIcon,
        color: "text-emerald-400",
        bgClass: "metric-card-opportunity",
        iconBg: "bg-emerald-500/10 border-emerald-500/20",
    },
    volume: {
        icon: VolumeIcon,
        color: "text-sky-400",
        bgClass: "metric-card-volume",
        iconBg: "bg-sky-500/10 border-sky-500/20",
    },
};

export function MetricCard({ value, label, type, suffix, trend }: MetricCardProps) {
    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className={`pulse-card metric-card ${config.bgClass}`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${config.iconBg} border flex items-center justify-center`}>
                    <Icon size={20} className={config.color} />
                </div>
                {trend !== undefined && trend !== 0 && (
                    <span
                        className={`text-sm font-medium px-2 py-1 rounded-lg ${trend > 0
                                ? "text-red-400 bg-red-500/10"
                                : "text-emerald-400 bg-emerald-500/10"
                            }`}
                    >
                        {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                    </span>
                )}
            </div>

            <div className="flex items-baseline gap-1">
                <span className={`text-4xl md:text-5xl font-bold tabular-nums ${config.color}`}>
                    {value}
                </span>
                {suffix && (
                    <span className="text-lg text-white/30">{suffix}</span>
                )}
            </div>

            <p className="mt-2 text-sm text-white/40 uppercase tracking-wide">
                {label}
            </p>
        </div>
    );
}
