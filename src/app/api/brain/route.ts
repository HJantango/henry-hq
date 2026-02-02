import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BRAIN_API_URL = process.env.BRAIN_API_URL || "https://ip-172-31-15-96.tail64e67e.ts.net/brain-api";
const BRAIN_TOKEN = process.env.BRAIN_TOKEN || "henry-brain-2026";

// GET - list files or read a specific file
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");
  
  try {
    if (filePath) {
      // Fetch specific file from EC2
      const response = await fetch(
        `${BRAIN_API_URL}/file?path=${encodeURIComponent(filePath)}&token=${BRAIN_TOKEN}`,
        { cache: "no-store" }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to fetch" }));
        return NextResponse.json(error, { status: response.status });
      }
      
      return NextResponse.json(await response.json());
    } else {
      // Fetch folder tree from EC2
      const response = await fetch(
        `${BRAIN_API_URL}/tree?token=${BRAIN_TOKEN}`,
        { cache: "no-store" }
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to fetch tree" }));
        return NextResponse.json(error, { status: response.status });
      }
      
      const data = await response.json();
      return NextResponse.json({ tree: data.tree, live: true });
    }
  } catch (error) {
    console.error("Brain API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect to brain API" },
      { status: 500 }
    );
  }
}
