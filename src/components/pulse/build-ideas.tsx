import { BuildIdea } from "@/types/pulse";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BuildIdeasProps {
    ideas: BuildIdea[];
}

export function BuildIdeas({ ideas }: BuildIdeasProps) {
    if (ideas.length === 0) {
        return null;
    }

    return (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span>💡</span> Build Ideas
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
                {ideas.map((idea, index) => (
                    <div
                        key={index}
                        className="group p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                            <span className="text-lg">🚀</span>
                            {idea.name}
                        </h4>
                        <p className="text-sm text-white/60 mb-3">{idea.valueProp}</p>
                        <p className="text-xs text-white/40">
                            <span className="text-white/50">Target:</span> {idea.targetUser}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
