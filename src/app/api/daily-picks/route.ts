import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

interface DailyPick {
  emoji: string;
  title: string;
  description: string;
  category: "build" | "music" | "productivity" | "news" | "fun";
}

function getCacheKey(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCachePath(): string {
  return path.join("/tmp", `daily-picks-${getCacheKey()}.json`);
}

function readCache(): DailyPick[] | null {
  try {
    const cachePath = getCachePath();
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      return data;
    }
  } catch {
    // Cache miss
  }
  return null;
}

function writeCache(picks: DailyPick[]): void {
  try {
    fs.writeFileSync(getCachePath(), JSON.stringify(picks, null, 2));
  } catch {
    // Cache write fail is non-fatal
  }
}

export async function GET(req: NextRequest) {
  const refresh = req.nextUrl.searchParams.get("refresh") === "true";

  // Check cache first (unless refresh requested)
  if (!refresh) {
    const cached = readCache();
    if (cached) {
      return NextResponse.json({ picks: cached, cached: true });
    }
  }

  try {
    const picks = await generatePicks();
    writeCache(picks);
    return NextResponse.json({ picks, cached: false });
  } catch (error: unknown) {
    console.error("Daily picks error:", error);
    // Return fallback picks
    return NextResponse.json({
      picks: getFallbackPicks(),
      cached: false,
      fallback: true,
    });
  }
}

async function generatePicks(): Promise<DailyPick[]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `You are Henry, an AI owl assistant. Generate exactly 4 daily picks/suggestions for Heath.

Context about Heath:
- Runs Wild Octave (health food store in Brunswick Heads, NSW Australia)
- Loves AI tooling, building dashboards, automations, Claude Code
- Into electronic music (organic house, deep house, melodic techno)
- Has ADHD — needs scannable, actionable tips
- Learning to code, building cool things with AI
- Uses Claude Code daily

Generate 4 picks across these categories: build, music, productivity, news, fun
Each pick should be fresh, specific, and actionable. Today's date: ${new Date().toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.

Respond ONLY with a JSON array, no markdown, no code blocks. Each item must have:
- "emoji": a single emoji that fits the pick
- "title": short catchy title (max 8 words)
- "description": 1-2 sentence description, conversational and friendly
- "category": one of "build", "music", "productivity", "news", "fun"

Make it feel like a friend sharing cool finds. Be specific, not generic.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  // Parse JSON from response (handle potential markdown wrapping)
  let jsonStr = text.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const picks: DailyPick[] = JSON.parse(jsonStr);

  // Validate
  const validCategories = ["build", "music", "productivity", "news", "fun"];
  return picks.filter(
    (p) =>
      p.emoji &&
      p.title &&
      p.description &&
      validCategories.includes(p.category)
  ).slice(0, 4);
}

function getFallbackPicks(): DailyPick[] {
  return [
    {
      emoji: "🔧",
      title: "Build a CLI Tool with Claude",
      description: "Try building a quick CLI script that automates your daily store inventory check. Claude Code can scaffold it in minutes.",
      category: "build",
    },
    {
      emoji: "🎵",
      title: "Discover: Organic House Playlist",
      description: "Check out 'Cafe De Anatolia' on Spotify — perfect blend of organic house and world music for deep focus sessions.",
      category: "music",
    },
    {
      emoji: "⚡",
      title: "ADHD Power Trick: 2-Minute Rule",
      description: "If a task takes less than 2 minutes, do it NOW. Your future self will thank you. Stack 5 of these before lunch.",
      category: "productivity",
    },
    {
      emoji: "🚀",
      title: "Wild Octave Weekend Project",
      description: "What about a QR code menu that customers can scan in-store? Simple Next.js page, deploy to Railway in 10 minutes.",
      category: "fun",
    },
  ];
}
