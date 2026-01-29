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

        // Handle streamed chat events
        if (msg.type === "event" && msg.event === "chat") {
          const payload = msg.payload;
          if (payload) {
            // Collect text content from assistant messages
            if (payload.role === "assistant" && payload.content) {
              if (typeof payload.content === "string") {
                responseText += payload.content;
              } else if (Array.isArray(payload.content)) {
                for (const block of payload.content) {
                  if (block.type === "text" && block.text) {
                    responseText += block.text;
                  }
                }
              }
            }
            // Check for completion
            if (payload.type === "done" || payload.type === "complete" || payload.status === "done" || payload.done === true) {
              clearTimeout(timeout);
              ws.close();
              resolve(responseText || "Henry processed your message.");
            }
            // Handle text delta streaming
            if (payload.type === "text" || payload.type === "text_delta") {
              if (payload.text) responseText += payload.text;
            }
            // Handle message_complete event
            if (payload.type === "message_complete" || payload.type === "turn_complete") {
              clearTimeout(timeout);
              ws.close();
              resolve(responseText || "Henry processed your message.");
            }
          }
        }

        // Handle agent events for completion
        if (msg.type === "event" && msg.event === "agent") {
          const payload = msg.payload;
          if (payload && (payload.type === "done" || payload.type === "complete" || payload.status === "done")) {
            // Give a small delay to collect any final text
            setTimeout(() => {
              clearTimeout(timeout);
              ws.close();
              resolve(responseText || "Henry processed your message.");
            }, 500);
          }
          // Collect text from agent text events
          if (payload && payload.type === "text" && payload.text) {
            responseText += payload.text;
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
