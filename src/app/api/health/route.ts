import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const gatewayUrl = process.env.CLAWDBOT_GATEWAY_URL || "not-set";
  const tokenLen = (process.env.CLAWDBOT_GATEWAY_TOKEN || "").length;
  const tokenPreview = process.env.CLAWDBOT_GATEWAY_TOKEN 
    ? `${process.env.CLAWDBOT_GATEWAY_TOKEN.slice(0, 6)}...` 
    : "empty";
  
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    config: {
      gatewayUrl,
      tokenLength: tokenLen,
      tokenPreview
    }
  });
}
