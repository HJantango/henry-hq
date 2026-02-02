import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Brain API configuration
// Connects to EC2 brain server via Tailscale funnel
const BRAIN_API_URL = process.env.BRAIN_API_URL || "https://ip-172-31-15-96.tail64e67e.ts.net/brain-api";
const BRAIN_TOKEN = process.env.BRAIN_TOKEN || "henry-brain-2026";

// Timeout for EC2 requests (10 seconds)
const FETCH_TIMEOUT = 10000;

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// GET - list files or read a specific file
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");
  
  try {
    if (filePath) {
      // Fetch specific file from EC2
      const response = await fetchWithTimeout(
        `${BRAIN_API_URL}/file?path=${encodeURIComponent(filePath)}&token=${BRAIN_TOKEN}`
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to fetch file" }));
        return NextResponse.json(error, { status: response.status });
      }
      
      return NextResponse.json(await response.json());
    } else {
      // Fetch folder tree from EC2
      const response = await fetchWithTimeout(
        `${BRAIN_API_URL}/tree?token=${BRAIN_TOKEN}`
      );
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Failed to fetch tree" }));
        return NextResponse.json(error, { status: response.status });
      }
      
      const data = await response.json();
      return NextResponse.json({ 
        tree: data.tree, 
        live: true,
        source: "ec2-tailscale",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Brain API error:", error);
    
    // Provide detailed error for debugging
    const errorMessage = error instanceof Error 
      ? error.name === 'AbortError' 
        ? "Request timed out connecting to EC2 brain server"
        : error.message
      : "Failed to connect to brain API";
    
    return NextResponse.json(
      { 
        error: errorMessage,
        brainApiUrl: BRAIN_API_URL,
        hint: "Ensure EC2 brain-api service is running and Tailscale funnel is active",
      },
      { status: 500 }
    );
  }
}
