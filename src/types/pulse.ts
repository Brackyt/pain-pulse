export interface TopPhrase {
    phrase: string;
    count: number;
}

export interface PainSpike {
    weeklyVolume: number;
    monthlyVolume: number;
    deltaPercent: number;
}

export interface Theme {
    title: string;
    share: number; // Percentage 0-100
    quotes: string[];
    keywords?: string[]; // Per-bucket phrases
    sources: SourceLink[];
}

export interface SourceLink {
    title: string;
    url: string;
    source: "reddit" | "hackernews" | "github" | "stackoverflow";
}

export interface BuildIdea {
    name: string;
    valueProp: string;
    targetUser: string;
}

export interface SourceBreakdown {
    reddit: SubredditBreakdown[];
    hackernews: HNThreadBreakdown[];
}

export interface SubredditBreakdown {
    subreddit: string;
    count: number;
}

export interface HNThreadBreakdown {
    title: string;
    url: string;
    points: number;
}

export interface PulseStats {
    painIndex: number; // 0-100
    opportunityScore: number; // 0-100
    volume: number;
}

export interface PulseReport {
    query: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    windowDays: number;
    stats: PulseStats;
    painSpikes: PainSpike;
    topPhrases: TopPhrase[];
    themes: Theme[];
    sourceBreakdown: SourceBreakdown;
    buildIdeas: BuildIdea[];
    frictions: string[]; // Extracted top pain points/struggles
    painReceipts: string[]; // High-quality quotes proving pain (formerly bestQuotes)
}

// Raw post data from sources
export interface RawPost {
    id: string;
    title: string;
    body: string;
    url: string;
    source: "reddit" | "hackernews" | "github" | "stackoverflow";
    score: number;
    comments: number;
    createdAt: Date;
    subreddit?: string; // Reddit only
    author?: string;
    isSelf?: boolean; // Reddit: true if self post
}

// Firestore serializable version (with timestamps as numbers)
export interface PulseReportFirestore {
    query: string;
    slug: string;
    createdAt: number;
    updatedAt: number;
    windowDays: number;
    stats: PulseStats;
    painSpikes: PainSpike;
    topPhrases: TopPhrase[];
    themes: Theme[];
    sourceBreakdown: SourceBreakdown;
    buildIdeas: BuildIdea[];
    frictions: string[];
    painReceipts: string[];
}
