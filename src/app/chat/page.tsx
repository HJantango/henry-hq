"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string | { type: string; text?: string }[];
  timestamp?: string;
  ts?: string;
  createdAt?: string;
}

function extractText(content: string | { type: string; text?: string }[]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b.type === "text" && b.text)
      .map((b) => b.text)
      .join("\n");
  }
  return String(content);
}

function formatTimestamp(msg: ChatMessage): string {
  const ts = msg.timestamp || msg.ts || msg.createdAt;
  if (!ts) return "";
  try {
    const d = new Date(ts);
    return d.toLocaleString("en-AU", {
      timeZone: "Australia/Brisbane",
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
      hour12: true,
    });
  } catch {
    return "";
  }
}

const SESSION_KEYS = ["main", "webchat", "whatsapp"];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState("main");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchHistory = useCallback(async (session: string) => {
    try {
      setError(null);
      const res = await fetch(`/api/chat/history?sessionKey=${session}&limit=100`);
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setMessages([]);
      } else {
        setMessages(data.messages || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
      setMessages([]);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchHistory(activeSession);
  }, [activeSession, fetchHistory]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchHistory(activeSession), 30000);
    return () => clearInterval(interval);
  }, [activeSession, fetchHistory]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">💬</span>
            Chat Log
          </h1>
          <p className="text-dark-300 mt-1 text-sm">
            Conversation history with Henry
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-dark-500">
            Updated {lastRefresh.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true })}
          </span>
          <button
            onClick={() => { setLoading(true); fetchHistory(activeSession); }}
            className="px-3 py-1.5 text-xs glass hover:bg-white/[0.08] transition-colors rounded-xl text-dark-300 hover:text-white"
          >
            ↻ Refresh
          </button>
          <Link
            href="/terminal"
            className="px-3 py-1.5 text-xs bg-accent/20 text-accent-light border border-accent/30 rounded-xl hover:bg-accent/30 transition-colors"
          >
            Open Terminal →
          </Link>
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex gap-2 animate-fade-in" style={{ animationDelay: "100ms" }}>
        {SESSION_KEYS.map((key) => (
          <button
            key={key}
            onClick={() => setActiveSession(key)}
            className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 ${
              activeSession === key
                ? "bg-accent/20 text-accent-light border border-accent/30"
                : "glass text-dark-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        className="glass-strong p-4 sm:p-6 min-h-[60vh] max-h-[75vh] overflow-y-auto animate-fade-in"
        style={{ animationDelay: "200ms" }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-3 animate-pulse">🦝</div>
              <p className="text-dark-400 text-sm">Loading chat history...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-400 text-sm mb-2">{error}</p>
              <p className="text-dark-500 text-xs">
                Make sure the gateway is reachable and CLAWDBOT_GATEWAY_TOKEN is set.
              </p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-dark-400 text-sm">No messages in &ldquo;{activeSession}&rdquo; session</p>
              <Link href="/terminal" className="text-accent-light text-xs mt-2 inline-block hover:underline">
                Start a conversation →
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";
              const text = extractText(msg.content);
              const time = formatTimestamp(msg);

              if (isSystem) {
                return (
                  <div key={i} className="flex justify-center">
                    <span className="text-xs text-dark-500 bg-dark-800/50 px-3 py-1 rounded-full">
                      {text}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div className={`max-w-[80%] ${isUser ? "order-1" : ""}`}>
                    {/* Sender label */}
                    <div className={`flex items-center gap-2 mb-1 ${isUser ? "justify-end" : ""}`}>
                      {!isUser && <span className="text-xs font-medium text-accent-light">🦝 HenryII</span>}
                      {isUser && <span className="text-xs font-medium text-dark-300">Heath</span>}
                      {time && <span className="text-xs text-dark-500">{time}</span>}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? "bg-accent/20 text-white border border-accent/20 rounded-tr-md"
                          : "bg-dark-800/70 text-dark-100 border border-white/[0.06] rounded-tl-md"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{text}</p>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:text-white prose-headings:mt-3 prose-headings:mb-1 prose-code:text-accent-light prose-code:bg-dark-900/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-dark-900/80 prose-pre:border prose-pre:border-white/[0.06] prose-a:text-accent-light">
                          <ReactMarkdown>{text}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="text-center animate-fade-in" style={{ animationDelay: "300ms" }}>
        <p className="text-dark-500 text-xs">
          This is a read-only log. <Link href="/terminal" className="text-accent-light hover:underline">Open Terminal</Link> to send messages.
          Auto-refreshes every 30 seconds.
        </p>
      </div>
    </div>
  );
}
