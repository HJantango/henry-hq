"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TerminalMessage } from "@/lib/types";

export default function TerminalPage() {
  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      id: "sys_1",
      type: "system",
      content: "Henry Terminal v2.0 — Connected to Clawdbot 🦉",
      timestamp: new Date().toISOString(),
    },
    {
      id: "sys_2",
      type: "system",
      content: "Type a message to talk to Henry. Local commands: help, clear, status, whoami, projects",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "error" | "checking">("checking");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Check connection on mount
  useEffect(() => {
    setConnectionStatus("connected"); // Optimistic — will show error if send fails
  }, []);

  const addMessage = useCallback((msg: TerminalMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isTyping) return;

      const userInput = input.trim();
      const userMsg: TerminalMessage = {
        id: `msg_${Date.now()}`,
        type: "input",
        content: userInput,
        timestamp: new Date().toISOString(),
      };

      addMessage(userMsg);
      setHistory((prev) => [userInput, ...prev]);
      setHistoryIndex(-1);
      setInput("");

      // Handle local commands
      const cmd = userInput.toLowerCase();

      if (cmd === "clear") {
        setMessages([]);
        return;
      }

      if (cmd === "help") {
        addMessage({
          id: `resp_${Date.now()}`,
          type: "output",
          content: `Local commands:
  help     — Show this help message
  status   — Check Henry's connection status
  whoami   — Display user info
  projects — List active projects
  clear    — Clear terminal
  
Anything else is sent directly to Henry via Clawdbot gateway.
Henry has full context of your workspace, projects, and tools.`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (cmd === "status") {
        // Fetch actual status from gateway
        try {
          const res = await fetch("/api/gateway/status");
          const data = await res.json();
          addMessage({
            id: `resp_${Date.now()}`,
            type: "output",
            content: `${data.status === "online" ? "🟢" : "🔴"} Henry is ${data.status} via Clawdbot Gateway
   Endpoint: ${data.gatewayUrl || "unknown"}
   Channel: webchat
   Model: ${data.model || "Claude (Anthropic)"}
   Mode: Personal Assistant`,
            timestamp: new Date().toISOString(),
          });
          setConnectionStatus(data.status === "online" ? "connected" : "error");
        } catch {
          addMessage({
            id: `resp_${Date.now()}`,
            type: "output",
            content: `🔴 Could not reach gateway status endpoint`,
            timestamp: new Date().toISOString(),
          });
          setConnectionStatus("error");
        }
        return;
      }

      if (cmd === "whoami") {
        addMessage({
          id: `resp_${Date.now()}`,
          type: "output",
          content: `👤 Heath — Wild Octave
   Role: Founder
   Location: Brunswick Heads, NSW
   Dashboard: Henry HQ
   Status: Building cool things with AI`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      if (cmd === "projects") {
        addMessage({
          id: `resp_${Date.now()}`,
          type: "output",
          content: `Fetching from Henry... (sending to Clawdbot)`,
          timestamp: new Date().toISOString(),
        });
      }

      // Send to Clawdbot via API
      setIsTyping(true);
      try {
        const res = await fetch("/api/terminal/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userInput }),
        });

        const data = await res.json();

        if (data.error) {
          setConnectionStatus("error");
          addMessage({
            id: `err_${Date.now()}`,
            type: "system",
            content: `⚠️ ${data.error}`,
            timestamp: new Date().toISOString(),
          });
        } else {
          setConnectionStatus("connected");
          addMessage({
            id: `resp_${Date.now()}`,
            type: "output",
            content: data.response || "Henry processed your message.",
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        setConnectionStatus("error");
        addMessage({
          id: `err_${Date.now()}`,
          type: "system",
          content: `⚠️ Failed to reach Henry: ${err instanceof Error ? err.message : "Network error"}`,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setIsTyping(false);
      }
    },
    [input, isTyping, addMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIdx = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(newIdx);
      if (history[newIdx]) setInput(history[newIdx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIdx = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIdx);
      setInput(newIdx === -1 ? "" : history[newIdx] || "");
    }
  };

  return (
    <div className="fixed inset-0 lg:left-64 flex flex-col bg-dark-950">
      {/* Terminal Header */}
      <div className="flex items-center gap-3 px-6 py-3 bg-dark-900/80 border-b border-white/[0.06] backdrop-blur-lg">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>
        <span className="text-xs font-mono text-dark-300 ml-2">henry@hq ~ terminal</span>
        <div className="ml-auto flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500 animate-glow-pulse"
                : connectionStatus === "error"
                ? "bg-red-500"
                : "bg-yellow-500 animate-pulse"
            }`}
          />
          <span className="text-xs text-dark-400">
            {connectionStatus === "connected"
              ? "Connected to Clawdbot"
              : connectionStatus === "error"
              ? "Connection issue"
              : "Checking..."}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-2 font-mono text-sm">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fade-in">
            {msg.type === "system" ? (
              <p className="text-dark-400 text-xs py-1">
                <span className="text-accent/60">[system]</span> {msg.content}
              </p>
            ) : msg.type === "input" ? (
              <div className="flex">
                <span className="text-accent-light mr-2 select-none">heath&gt;</span>
                <span className="text-white">{msg.content}</span>
              </div>
            ) : (
              <pre className="text-green-400/90 whitespace-pre-wrap pl-8 leading-relaxed">
                {msg.content}
              </pre>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2 pl-8 animate-fade-in">
            <span className="text-accent/60 text-xs">🦉 henry is thinking</span>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-white/[0.06] bg-dark-900/50 backdrop-blur-lg">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-accent-light select-none text-sm">heath&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isTyping ? "Waiting for Henry..." : "Type a command or message..."}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-dark-500 caret-accent-light"
            autoFocus
            disabled={isTyping}
          />
          {isTyping && (
            <span className="text-xs text-dark-500 animate-pulse">Processing...</span>
          )}
        </div>
      </form>
    </div>
  );
}
