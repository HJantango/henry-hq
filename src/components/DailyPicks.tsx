"use client";

import { useState, useEffect } from "react";
import { addTask } from "@/lib/store";

interface DailyPick {
  emoji: string;
  title: string;
  description: string;
  category: "build" | "music" | "productivity" | "news" | "fun";
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  build: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/25" },
  music: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/25" },
  productivity: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25" },
  news: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/25" },
  fun: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/25" },
};

const categoryLabels: Record<string, string> = {
  build: "Build",
  music: "Music",
  productivity: "Focus",
  news: "News",
  fun: "Fun",
};

export default function DailyPicks() {
  const [picks, setPicks] = useState<DailyPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addedPicks, setAddedPicks] = useState<Set<number>>(new Set());

  const handleAddToTasks = (pick: DailyPick, index: number) => {
    addTask({
      title: `${pick.emoji} ${pick.title}`,
      description: pick.description,
      priority: pick.category === "productivity" ? "high" : "medium",
      status: "todo",
    });
    setAddedPicks(prev => new Set(prev).add(index));
    // Reset after 2 seconds for visual feedback
    setTimeout(() => {
      setAddedPicks(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, 2000);
  };

  const fetchPicks = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      const url = refresh ? "/api/daily-picks?refresh=true" : "/api/daily-picks";
      const res = await fetch(url);
      const data = await res.json();
      if (data.picks) setPicks(data.picks);
    } catch {
      // Fallback handled by API
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPicks();
  }, []);

  return (
    <div className="glass p-6 relative overflow-hidden animate-slide-up" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
      {/* Subtle sparkle background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-3 right-8 w-1 h-1 bg-yellow-400/40 rounded-full animate-pulse" style={{ animationDelay: "0s" }} />
        <div className="absolute top-8 right-20 w-0.5 h-0.5 bg-blue-400/30 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-5 right-32 w-1 h-1 bg-purple-400/30 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-12 right-14 w-0.5 h-0.5 bg-emerald-400/30 rounded-full animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🦝</span>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">HenryII&apos;s Daily Picks</h3>
            <p className="text-xs text-dark-400 mt-0.5">Curated chaos for today</p>
          </div>
        </div>
        <button
          onClick={() => fetchPicks(true)}
          disabled={refreshing}
          className="p-2 rounded-xl text-dark-400 hover:text-accent-light hover:bg-white/[0.04] transition-all disabled:opacity-50"
          title="Get fresh picks"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3 p-3 rounded-xl bg-white/[0.02]">
              <div className="w-8 h-8 rounded-lg bg-dark-700/50" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-dark-700/50 rounded w-2/3" />
                <div className="h-2 bg-dark-700/30 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Picks grid */
        <div className="space-y-2.5">
          {picks.map((pick, i) => {
            const colors = categoryColors[pick.category] || categoryColors.fun;
            return (
              <div
                key={i}
                className="group flex gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.06] transition-all duration-200"
              >
                <div className="text-2xl flex-shrink-0 mt-0.5">{pick.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white truncate">{pick.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider flex-shrink-0 border ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {categoryLabels[pick.category] || pick.category}
                    </span>
                  </div>
                  <p className="text-xs text-dark-300 leading-relaxed line-clamp-2">{pick.description}</p>
                </div>
                {/* Add to Tasks button */}
                <button
                  onClick={() => handleAddToTasks(pick, i)}
                  disabled={addedPicks.has(i)}
                  className={`self-center p-2 rounded-lg transition-all flex-shrink-0 ${
                    addedPicks.has(i)
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "opacity-0 group-hover:opacity-100 text-dark-400 hover:text-accent-light hover:bg-white/[0.06]"
                  }`}
                  title={addedPicks.has(i) ? "Added!" : "Add to tasks"}
                >
                  {addedPicks.has(i) ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
