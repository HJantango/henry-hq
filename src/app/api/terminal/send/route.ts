import { NextRequest, NextResponse } from "next/server";
import WebSocket from "ws";

export const dynamic = "force-dynamic";

const GATEWAY_URL = process.env.CLAWDBOT_GATEWAY_URL || "ws://127.0.0.1:18789";
const GATEWAY_TOKEN = process.env.CLAWDBOT_GATEWAY_TOKEN || "";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const response = await sendToGateway(message);
    return NextResponse.json({ response });
  } catch (error: unknown) {
    console.error("Terminal send error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to communicate with Henry";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}

function sendToGateway(message: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(GATEWAY_URL);
    const connectId = generateId();
    const chatSendId = generateId();
    let responseText = "";
    let connected = false;
    let runId: string | null = null;
    const timeout = setTimeout(() => {
      ws.close();
      if (responseText) {
        resolve(responseText);
      } else {
        reject(new Error("Gateway timeout — Henry may be busy. Try again in a moment."));
      }
    }, 60000); // 60s timeout

    const sendConnect = () => {
      ws.send(JSON.stringify({
        type: "req",
        id: connectId,
        method: "connect",
        params: {
          minProtocol: 3,
          maxProtocol: 3,
          client: {
            id: "webchat",
            version: "1.0.0",
            platform: "web",
            mode: "webchat",
          },
          role: "operator",
          scopes: ["operator.read", "operator.write"],
          caps: [],
          commands: [],
          permissions: {},
          auth: { token: GATEWAY_TOKEN },
          locale: "en-AU",
          userAgent: "henry-hq-terminal/1.0.0",
        },
      }));
    };

    // Don't send connect on open — wait for the challenge event first
    // (handled in the message handler below)

    ws.on("message", (data) => {
      try {
        const msg = JSON.parse(data.toString());

        // Handle connect challenge — gateway sends this before accepting connect
        if (msg.type === "event" && msg.event === "connect.challenge") {
          sendConnect();
          return;
        }

        // Handle connect response
        if (msg.type === "res" && msg.id === connectId) {
          if (msg.ok) {
            connected = true;
            // Send chat message
            ws.send(JSON.stringify({
              type: "req",
              id: chatSendId,
              method: "chat.send",
              params: {
                message: message,
                sessionKey: "webchat",
                idempotencyKey: generateId(),
              },
            }));
          } else {
            clearTimeout(timeout);
            ws.close();
            reject(new Error("Gateway auth failed"));
          }
        }

        // Handle chat.send ack
        if (msg.type === "res" && msg.id === chatSendId) {
          if (msg.ok && msg.payload) {
            runId = msg.payload.runId;
            // If status is ok (cached/done), we got the result
            if (msg.payload.status === "ok" && !runId) {
              clearTimeout(timeout);
              ws.close();
              resolve(responseText || "Message sent to Henry.");
            }
          } else if (!msg.ok) {
            clearTimeout(timeout);
            ws.close();
            reject(new Error(msg.payload?.message || "chat.send failed"));
          }
        }

        // Handle streamed chat events (state: delta/final, message.content)
        if (msg.type === "event" && msg.event === "chat") {
          const payload = msg.payload;
          if (payload?.state === "final" && payload?.message?.role === "assistant") {
            // Final message - extract text from content blocks
            const content = payload.message.content;
            if (Array.isArray(content)) {
              responseText = ""; // Reset to get final clean text
              for (const block of content) {
                if (block.type === "text" && block.text) {
                  responseText += block.text;
                }
              }
            }
            clearTimeout(timeout);
            ws.close();
            resolve(responseText || "Henry processed your message.");
          }
        }

        // Handle agent events (stream: assistant with data.delta, lifecycle with phase: end)
        if (msg.type === "event" && msg.event === "agent") {
          const payload = msg.payload;
          if (payload) {
            // Collect streaming text deltas
            if (payload.stream === "assistant" && payload.data?.delta) {
              responseText += payload.data.delta;
            }
            // End of response
            if (payload.stream === "lifecycle" && payload.data?.phase === "end") {
              setTimeout(() => {
                clearTimeout(timeout);
                ws.close();
                resolve(responseText || "Henry processed your message.");
              }, 100);
            }
          }
        }
      } catch {
        // Ignore parse errors on incoming messages
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error(`Gateway connection failed: ${err.message}. Is Clawdbot running?`));
    });

    ws.on("close", () => {
      clearTimeout(timeout);
      if (!connected) {
        reject(new Error("Gateway disconnected before handshake completed"));
      } else if (responseText) {
        resolve(responseText);
      }
    });
  });
}
