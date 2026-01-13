interface MetricCardProps {
    value: number;
    label: string;
    color: "red" | "green" | "blue" | "orange";
    suffix?: string;
    trend?: number;
}

const colorClasses = {
    red: "text-red-400",
    green: "text-emerald-400",
    blue: "text-sky-400",
    orange: "text-orange-400",
};

export function MetricCard({ value, label, color, suffix, trend }: MetricCardProps) {
    return (
        <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-white/5 to-white/0 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors">
                <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${colorClasses[color]}`}>
                        {value}
                    </span>
                    {suffix && (
                        <span className="text-2xl text-white/40">{suffix}</span>
                    )}
                    {trend !== undefined && trend !== 0 && (
                        <span
                            className={`text-sm font-medium ${trend > 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                        >
                            {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
                        </span>
                    )}
                </div>
                <p className="mt-2 text-sm text-white/50 uppercase tracking-wider">
                    {label}
                </p>
            </div>
        </div>
    );
}
