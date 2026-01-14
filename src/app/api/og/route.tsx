import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get("slug");

    // Load font from local file system
    const fontData = await fetch(new URL('./Inter-Bold.woff', import.meta.url)).then(
        (res) => res.arrayBuffer()
    );

    if (!slug) {
        return new Response("Missing slug parameter", { status: 400 });
    }

    try {
        // For edge runtime, we need to handle Firebase differently
        // Since edge runtime may not support firebase-admin,
        // we'll use query params as fallback
        const query = searchParams.get("query") || slug.replace(/-/g, " ");
        const painIndex = parseInt(searchParams.get("pain") || "0", 10);
        const opportunityScore = parseInt(searchParams.get("opportunity") || "0", 10);
        const volume = parseInt(searchParams.get("volume") || "0", 10);

        return new ImageResponse(
            (
                <div
                    style={{
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)",
                        fontFamily: "Inter, sans-serif",
                    }}
                >
                    {/* Background pattern */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                                "radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%)",
                            display: "flex",
                        }}
                    />

                    {/* Logo/Title */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "32px",
                        }}
                    >
                        <svg
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            style={{
                                color: "#ff6b6b",
                                marginRight: "16px",
                            }}
                        >
                            <path
                                d="M3 12h4l3-9 4 18 3-9h4"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <span
                            style={{
                                fontSize: "32px",
                                fontWeight: 700,
                                color: "#ffffff",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Pain Pulse
                        </span>
                    </div>

                    {/* Query/Keyword */}
                    <div
                        style={{
                            fontSize: "64px",
                            fontWeight: 800,
                            background: "linear-gradient(90deg, #ff6b6b, #ffc65c)",
                            backgroundClip: "text",
                            color: "transparent",
                            marginBottom: "48px",
                            textTransform: "capitalize",
                            display: "flex",
                        }}
                    >
                        {query}
                    </div>

                    {/* Stats Row */}
                    <div
                        style={{
                            display: "flex",
                            gap: "64px",
                        }}
                    >
                        {/* Pain Index */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "72px",
                                    fontWeight: 800,
                                    color: "#ff6b6b",
                                    display: "flex",
                                }}
                            >
                                {painIndex}
                            </div>
                            <div
                                style={{
                                    fontSize: "20px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    display: "flex",
                                }}
                            >
                                Pain Index
                            </div>
                        </div>

                        {/* Opportunity Score */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "72px",
                                    fontWeight: 800,
                                    color: "#4ade80",
                                    display: "flex",
                                }}
                            >
                                {opportunityScore}
                            </div>
                            <div
                                style={{
                                    fontSize: "20px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    display: "flex",
                                }}
                            >
                                Opportunity
                            </div>
                        </div>

                        {/* Volume */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "72px",
                                    fontWeight: 800,
                                    color: "#38bdf8",
                                    display: "flex",
                                }}
                            >
                                {volume}
                            </div>
                            <div
                                style={{
                                    fontSize: "20px",
                                    color: "#94a3b8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    display: "flex",
                                }}
                            >
                                Mentions
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "32px",
                            fontSize: "18px",
                            color: "#64748b",
                            display: "flex",
                        }}
                    >
                        pain-pulse.web.app
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
                fonts: [
                    {
                        name: 'Inter',
                        data: fontData,
                        style: 'normal',
                        weight: 700,
                    },
                ],
                headers: {
                    "Cache-Control": "public, max-age=3600, immutable",
                },
            }
        );
    } catch (error) {
        console.error("Failed to generate OG image:", error);
        return new Response("Failed to generate image", { status: 500 });
    }
}
