import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

export const dynamic = "force-dynamic";

const GATEWAY_URL = process.env.CLAWDBOT_GATEWAY_URL || "ws://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || "";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function GET(req: NextRequest) {
  try {
    const sessionKey = req.nextUrl.searchParams.get("sessionKey") || "webchat";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") || "100", 10);

    const messages = await fetchChatHistory(sessionKey, limit);
    return NextResponse.json({ messages, sessionKey });
  } catch (error: unknown) {
    console.error("Chat history error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to fetch chat history";
    return NextResponse.json({ error: errMsg, messages: [] }, { status: 500 });
  }
}

function fetchChatHistory(sessionKey: string, limit: number): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(GATEWAY_URL);
    const connectId = generateId();
    const historyId = generateId();

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Gateway timeout"));
    }, 15000);

    ws.on("open", () => {
      ws.send(JSON.stringify({
        type: "req",
        id: connectId,
        method: "connect",
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: "henry-hq-chat-history",
            version: "1.0.0",
            platform: "web",
            mode: "chat",
          },
          role: "operator",
          scopes: ["operator.read"],
          caps: [],
          commands: [],
          permissions: {},
          auth: { token: GATEWAY_TOKEN },
          locale: "en-AU",
          userAgent: "henry-hq-chat-history/1.0.0",
        },
      }));
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        if (msg.type === "res" && msg.id === connectId) {
          if (msg.ok) {
            ws.send(JSON.stringify({
              type: "req",
              id: historyId,
              method: "chat.history",
              params: { sessionKey, limit },
            }));
          } else {
            clearTimeout(timeout);
            ws.close();
            reject(new Error("Gateway auth failed"));
          }
        }

        if (msg.type === "res" && msg.id === historyId) {
          clearTimeout(timeout);
          ws.close();
          if (msg.ok) {
            const messages = msg.payload?.messages || msg.payload?.history || msg.payload || [];
            resolve(Array.isArray(messages) ? messages : []);
          } else {
            reject(new Error(msg.payload?.message || "chat.history failed"));
          }
        }
      } catch {
        // Ignore parse errors
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Gateway connection failed: ${err.message}`));
    });

    ws.on("close", () => {
      clearTimeout(timeout);
    });
  });
}
