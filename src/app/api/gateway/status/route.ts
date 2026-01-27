import { NextResponse } from "next/server";
import WebSocket from "ws";

export const dynamic = "force-dynamic";

const GATEWAY_URL = process.env.CLAWDBOT_GATEWAY_URL || "ws://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || "";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function GET() {
  try {
    const info = await checkGateway();
    return NextResponse.json({
      status: "online",
      gatewayUrl: GATEWAY_URL.replace(/token=[^&]+/, "token=***"),
      ...info,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      status: "offline",
      gatewayUrl: GATEWAY_URL.replace(/token=[^&]+/, "token=***"),
      error: errMsg,
    });
  }
}

function checkGateway(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(GATEWAY_URL);
    const connectId = generateId();

    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("Gateway timeout"));
    }, 8000);

    ws.on("open", () => {
      ws.send(JSON.stringify({
        type: "req",
        id: connectId,
        method: "connect",
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: "henry-hq-status-check",
            version: "1.0.0",
            platform: "web",
            mode: "operator",
          },
          role: "operator",
          scopes: ["operator.read"],
          caps: [],
          commands: [],
          permissions: {},
          auth: { token: GATEWAY_TOKEN },
          locale: "en-AU",
          userAgent: "henry-hq-status-check/1.0.0",
        },
      }));
    });

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "res" && msg.id === connectId) {
          clearTimeout(timeout);
          ws.close();
          if (msg.ok) {
            resolve({
              agent: msg.payload?.agent || {},
              model: msg.payload?.model || msg.payload?.agent?.model || "unknown",
              connectedAt: new Date().toISOString(),
            });
          } else {
            reject(new Error("Auth failed"));
          }
        }
      } catch {
        // ignore
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Connection failed: ${err.message}`));
    });

    ws.on("close", () => {
      clearTimeout(timeout);
    });
  });
}
