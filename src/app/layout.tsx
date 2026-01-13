import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pain Pulse - Internet Frustration Barometer",
  description:
    "Discover what people are complaining about on Reddit and Hacker News. Generate shareable market pain reports to find startup opportunities.",
  keywords: ["market research", "startup ideas", "reddit", "hacker news", "pain points", "opportunities"],
  openGraph: {
    title: "Pain Pulse - Internet Frustration Barometer",
    description:
      "Discover what people are complaining about on Reddit and Hacker News. Generate shareable market pain reports.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pain Pulse - Internet Frustration Barometer",
    description:
      "Discover what people are complaining about on Reddit and Hacker News.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
