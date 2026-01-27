"use client";

import { useState, useEffect } from "react";

export default function HenryStatus() {
  const [status, setStatus] = useState<"online" | "thinking" | "offline">("online");

  useEffect(() => {
    // Cycle through states for demo
    const interval = setInterval(() => {
      setStatus((s) => (s === "online" ? "thinking" : "online"));
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    online: { color: "bg-green-500", text: "Online", glow: "shadow-green-500/50" },
    thinking: { color: "bg-amber-500", text: "Thinking...", glow: "shadow-amber-500/50" },
    offline: { color: "bg-dark-400", text: "Offline", glow: "" },
  };

  const config = statusConfig[status];

  return (
    <div
      className="glass-hover p-5 animate-slide-up"
      style={{ animationDelay: "300ms", animationFillMode: "both" }}
    >
      <p className="text-xs font-medium text-dark-300 uppercase tracking-wider mb-3">
        Henry Status
      </p>
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-blue-700 flex items-center justify-center text-lg">
            🦉
          </div>
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${config.color} border-2 border-dark-800 ${config.glow} shadow-lg`}
          />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Henry</p>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${config.color} ${status === "thinking" ? "animate-pulse" : ""}`} />
            <p className="text-xs text-dark-300">{config.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
