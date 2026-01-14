import { BuildIdea } from "@/types/pulse";
import { RocketIcon } from "@/components/ui/icons";

interface BuildIdeasProps {
    ideas: BuildIdea[];
}

export function BuildIdeas({ ideas }: BuildIdeasProps) {
    if (ideas.length === 0) {
        return null;
    }

    return (
        <div className="pulse-card p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <RocketIcon size={20} className="text-cyan-400" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white">Build Ideas</h3>
                    <p className="text-sm text-white/40">Startup opportunities spotted</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {ideas.map((idea, index) => (
                    <div
                        key={index}
                        className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 hover:bg-cyan-500/[0.02] transition-all duration-200"
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <span className="shrink-0 w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold flex items-center justify-center">
                                {index + 1}
                            </span>
                            <h4 className="font-semibold text-white group-hover:text-cyan-100 transition-colors">
                                {idea.name}
                            </h4>
                        </div>
                        <p className="text-sm text-white/50 mb-3 ml-9">{idea.valueProp}</p>
                        <div className="ml-9 flex items-center gap-2 text-xs text-white/30">
                            <span className="text-white/40">Target:</span>
                            <span className="text-white/60">{idea.targetUser}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
