"use client";

import { BuildIdea } from "@/types/pulse";
import { RocketIcon } from "@/components/ui/icons";
import { ScrollReveal } from "@/components/ui/scroll-reveal";

interface BuildIdeasProps {
    ideas: BuildIdea[];
}

export function BuildIdeas({ ideas }: BuildIdeasProps) {
    if (ideas.length === 0) {
        return null;
    }

    return (
        <ScrollReveal>
            <div className="pulse-card p-6 md:p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                        <RocketIcon size={24} className="text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">Build Ideas</h3>
                        <p className="text-sm text-white/40">Startup opportunities spotted</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {ideas.map((idea, index) => (
                        <ScrollReveal key={index} delay={index * 80}>
                            <div className="group h-full p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all duration-300">
                                <div className="flex items-start gap-3 mb-3">
                                    <span className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center border border-cyan-500/20 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-shadow">
                                        {index + 1}
                                    </span>
                                    <h4 className="font-semibold text-white group-hover:text-cyan-100 transition-colors text-lg">
                                        {idea.name}
                                    </h4>
                                </div>
                                <p className="text-sm text-white/60 mb-4 ml-11 leading-relaxed">{idea.valueProp}</p>
                                <div className="ml-11 flex items-center gap-2">
                                    <span className="text-xs text-white/30 uppercase tracking-wider">Target</span>
                                    <span className="text-xs text-cyan-400/80 bg-cyan-500/10 px-2 py-1 rounded-md">
                                        {idea.targetUser}
                                    </span>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </ScrollReveal>
    );
}
