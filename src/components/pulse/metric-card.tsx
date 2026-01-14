"use client";

import { RadialGauge } from "@/components/ui/radial-gauge";
import { AnimatedNumber } from "@/components/ui/animated-number";
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
        gaugeType: "pain" as const,
    },
    opportunity: {
        icon: TargetIcon,
        color: "text-emerald-400",
        bgClass: "metric-card-opportunity",
        iconBg: "bg-emerald-500/10 border-emerald-500/20",
        gaugeType: "opportunity" as const,
    },
    volume: {
        icon: VolumeIcon,
        color: "text-sky-400",
        bgClass: "metric-card-volume",
        iconBg: "bg-sky-500/10 border-sky-500/20",
        gaugeType: "neutral" as const,
    },
};

export function MetricCard({ value, label, type, suffix, trend }: MetricCardProps) {
    const config = typeConfig[type];
    const Icon = config.icon;
    const showGauge = type === "pain" || type === "opportunity";

    return (
        <div className={`pulse-card metric-card ${config.bgClass} ${showGauge ? 'metric-card-gauge' : ''}`}>
            {showGauge ? (
                // Radial gauge layout for pain/opportunity
                <div className="flex flex-col items-center text-center">
                    <RadialGauge
                        value={value}
                        type={config.gaugeType}
                        size={120}
                        strokeWidth={8}
                        suffix={suffix}
                    />
                    <p className="mt-4 text-sm text-white/50 uppercase tracking-wider font-medium">
                        {label}
                    </p>
                </div>
            ) : (
                // Standard layout for volume
                <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <div className={`w-10 h-10 rounded-xl ${config.iconBg} border flex items-center justify-center`}>
                            <Icon size={20} className={config.color} />
                        </div>
                        {trend !== undefined && trend !== 0 && (
                            <span
                                className={`text-sm font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 ${trend > 0
                                        ? "text-red-400 bg-red-500/10"
                                        : "text-emerald-400 bg-emerald-500/10"
                                    }`}
                            >
                                <span className="text-base">
                                    {trend > 0 ? "↑" : "↓"}
                                </span>
                                <AnimatedNumber value={Math.abs(trend)} suffix="%" />
                            </span>
                        )}
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl md:text-5xl font-bold ${config.color}`}>
                            <AnimatedNumber value={value} duration={1200} />
                        </span>
                        {suffix && (
                            <span className="text-lg text-white/30">{suffix}</span>
                        )}
                    </div>

                    <p className="mt-2 text-sm text-white/40 uppercase tracking-wide">
                        {label}
                    </p>
                </div>
            )}
        </div>
    );
}
