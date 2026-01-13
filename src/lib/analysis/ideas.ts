import { Theme, BuildIdea } from "@/types/pulse";

/**
 * Generate actionable build ideas based on detected themes
 */
export function generateBuildIdeas(themes: Theme[], query: string): BuildIdea[] {
    const ideas: BuildIdea[] = [];
    const queryLower = query.toLowerCase();
    const queryTitled = query.charAt(0).toUpperCase() + query.slice(1);

    // Generate ideas based on actual theme patterns
    for (const theme of themes.slice(0, 3)) {
        const title = theme.title.toLowerCase();

        // "Alternative to X" → Build a simpler/cheaper alternative
        if (title.includes("alternative")) {
            const match = title.match(/alternative\s+to\s+(\w+)/);
            const product = match ? match[1] : queryTitled;
            ideas.push({
                name: `Open${product.charAt(0).toUpperCase() + product.slice(1)}`,
                valueProp: `Open-source, self-hosted alternative to ${product} with no vendor lock-in`,
                targetUser: `Developers and teams frustrated with ${product}'s pricing or limitations`,
            });
        }
        // "Looking for X" → Build that thing
        else if (title.includes("looking for")) {
            const match = title.match(/looking\s+for\s+(?:a\s+)?(\w+)/);
            const thing = match ? match[1] : "solution";
            ideas.push({
                name: `${thing.charAt(0).toUpperCase() + thing.slice(1)}Hub`,
                valueProp: `The ${thing} people are actually looking for - simple, focused, no bloat`,
                targetUser: `Users who can't find a good ${thing} in the ${queryTitled} space`,
            });
        }
        // "Problem/Issue with X" → Build a fixer
        else if (title.includes("problem") || title.includes("issue")) {
            const match = title.match(/(?:problem|issue)\s+with\s+(\w+)/);
            const problem = match ? match[1] : queryTitled;
            ideas.push({
                name: `${problem.charAt(0).toUpperCase() + problem.slice(1)}Fixer`,
                valueProp: `One-click solution for the most common ${problem} problems`,
                targetUser: `Non-technical users struggling with ${problem} issues`,
            });
        }
        // "Frustrated with X" → Build a calmer alternative
        else if (title.includes("frustrated") || title.includes("hate")) {
            ideas.push({
                name: `Calm${queryTitled}`,
                valueProp: `${queryTitled} tool designed to reduce friction, not add it`,
                targetUser: `Users burned out by existing ${queryTitled} solutions`,
            });
        }
        // Default: generic useful tool
        else {
            ideas.push({
                name: `${queryTitled}Pilot`,
                valueProp: `Smart ${queryTitled} assistant that handles the tedious parts automatically`,
                targetUser: `Busy professionals who want ${queryTitled} to just work`,
            });
        }
    }

    // Always add these evergreen ideas if we have room
    if (ideas.length < 4) {
        ideas.push({
            name: `${queryTitled}Lite`,
            valueProp: `The simplest possible ${queryLower} tool - does one thing, does it well`,
            targetUser: "Minimalists who hate bloated software with features they'll never use",
        });
    }

    if (ideas.length < 4) {
        ideas.push({
            name: `${queryTitled}Compare`,
            valueProp: `Side-by-side comparison tool for ${queryLower} solutions with real user reviews`,
            targetUser: `People researching ${queryLower} options before committing`,
        });
    }

    // Remove duplicates and limit
    const seen = new Set<string>();
    const unique = ideas.filter((idea) => {
        const key = idea.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    return unique.slice(0, 4);
}
