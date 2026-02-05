"use client";

import { useState, useEffect } from "react";

interface GatewayStatus {
  status: "online" | "offline";
  model?: string;
  connectedAt?: string;
  error?: string;
  gatewayUrl?: string;
}

export default function HenryStatus() {
  const [gateway, setGateway] = useState<GatewayStatus | null>(null);
  const [checking, setChecking] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/gateway/status");
      const data = await res.json();
      setGateway(data);
    } catch {
      setGateway({ status: "offline", error: "Failed to reach API" });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every 60s
    return () => clearInterval(interval);
  }, []);

  const isOnline = gateway?.status === "online";

  const statusConfig = {
    online: { color: "bg-green-500", text: "Online", glow: "shadow-green-500/50" },
    checking: { color: "bg-yellow-500", text: "Checking...", glow: "shadow-yellow-500/50" },
    offline: { color: "bg-dark-400", text: "Offline", glow: "" },
  };

  const state = checking ? "checking" : isOnline ? "online" : "offline";
  const config = statusConfig[state];

  return (
    <div
      className="glass-hover p-5 animate-slide-up"
      style={{ animationDelay: "300ms", animationFillMode: "both" }}
    >
      <p className="text-xs font-medium text-dark-300 uppercase tracking-wider mb-3">
        HenryII Status
      </p>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center text-lg">
            🦝
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${config.color} border-2 border-dark-800 ${config.glow} shadow-lg`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">HenryII</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${config.color} ${state === "checking" ? "animate-pulse" : ""}`} />
            <p className="text-xs text-dark-300">{config.text}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      {!checking && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-1.5">
          {isOnline && gateway?.model && gateway.model !== "unknown" && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-400">Model</span>
              <span className="text-xs text-dark-200 font-mono">{String(gateway.model)}</span>
            </div>
          )}
          {gateway?.gatewayUrl && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-dark-400">Gateway</span>
              <span className="text-xs text-dark-300 font-mono truncate ml-2 max-w-[140px]">
                {gateway.gatewayUrl.replace("ws://", "").replace("wss://", "")}
              </span>
            </div>
          )}
          {!isOnline && gateway?.error && (
            <p className="text-xs text-red-400/70 mt-1">{gateway.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
