import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// HTTP endpoint (not WS) - tools/invoke API
const GATEWAY_HTTP_URL = process.env.CLAWDBOT_GATEWAY_URL?.replace("ws://", "http://").replace("wss://", "https://") || "http://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || "";

export async function GET(req: NextRequest) {
  try {
    const sessionKey = req.nextUrl.searchParams.get("sessionKey") || "main";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100", 10);

    // Use the tools/invoke HTTP endpoint to call sessions_history
    const response = await fetch(`${GATEWAY_HTTP_URL}/tools/invoke`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tool: "sessions_history",
        args: {
          sessionKey: `agent:main:${sessionKey}`,
          limit,
          includeTools: false,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Gateway error:", response.status, text);
      return NextResponse.json(
        { error: `Gateway returned ${response.status}`, messages: [] },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to fetch history", messages: [] },
        { status: 400 }
      );
    }

    // Extract messages from result
    const messages = data.result?.messages || [];
    return NextResponse.json({ messages, sessionKey });
  } catch (error: unknown) {
    console.error("Chat history error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to fetch chat history";
    return NextResponse.json({ error: errMsg, messages: [] }, { status: 500 });
  }
}
