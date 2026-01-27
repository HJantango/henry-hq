"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TerminalMessage } from "@/lib/types";

export default function TerminalPage() {
  const [messages, setMessages] = useState<TerminalMessage[]>([
    {
      id: "sys_1",
      type: "system",
      content: "Henry Terminal v1.0 — Connected to Clawdbot 🦉",
      timestamp: new Date().toISOString(),
    },
    {
      id: "sys_2",
      type: "system",
      content: "Type a message to communicate with Henry. Type 'help' for commands.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim()) return;

      const userMsg: TerminalMessage = {
        id: `msg_${Date.now()}`,
        type: "input",
        content: input.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setHistory((prev) => [input.trim(), ...prev]);
      setHistoryIndex(-1);
      setInput("");
      setIsTyping(true);

      // Mock responses
      const cmd = input.trim().toLowerCase();
      let response = "Henry is connected via Clawdbot — messages sent here route to the main session. Full integration coming soon.";

      if (cmd === "help") {
        response = `Available commands:
  help     — Show this help message
  status   — Check Henry's status
  whoami   — Display user info
  projects — List active projects
  clear    — Clear terminal
  
Any other input will be routed to Henry via Clawdbot.`;
      } else if (cmd === "status") {
        response = "🟢 Henry is online and operational.\n   Model: Claude (Anthropic)\n   Uptime: Continuous\n   Mode: Personal Assistant";
      } else if (cmd === "whoami") {
        response = "👤 Heath — Wild Octave\n   Role: Founder\n   Location: Brunswick Heads, NSW\n   Status: Building cool things";
      } else if (cmd === "projects") {
        response = "Active Projects:\n  1. Wild Octave Dashboard [████████░░] 65%\n  2. WebCM SEO            [████░░░░░░] 40%\n  3. Tax Catchup          [██░░░░░░░░] 20%";
      } else if (cmd === "clear") {
        setMessages([]);
        setIsTyping(false);
        return;
      }

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `resp_${Date.now()}`,
            type: "output",
            content: response,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 800 + Math.random() * 1200);
    },
    [input]
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
          <div className="w-2 h-2 rounded-full bg-green-500 animate-glow-pulse" />
          <span className="text-xs text-dark-400">Connected</span>
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
                <span className="text-accent-light mr-2 select-none">henry&gt;</span>
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
          <div className="flex items-center gap-1 pl-8 animate-fade-in">
            <span className="text-accent/60 text-xs">henry is thinking</span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-accent/60 animate-pulse" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-white/[0.06] bg-dark-900/50 backdrop-blur-lg">
        <div className="flex items-center gap-2 font-mono">
          <span className="text-accent-light select-none text-sm">henry&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or message..."
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-dark-500 caret-accent-light"
            autoFocus
          />
        </div>
      </form>
    </div>
  );
}
