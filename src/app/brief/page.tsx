"use client";

import { useEffect, useState } from "react";
import { Task, TaskList } from "@/lib/types";

export default function MorningBriefPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [lists, setLists] = useState<TaskList[]>([]);
  const [weather, setWeather] = useState<{ temp: number; condition: string; high: number; low: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Fetch tasks
    fetch("/api/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(data.tasks || []);
        setLists(data.lists || []);
      })
      .catch(console.error);

    // Fetch weather (Brunswick Heads, NSW)
    fetch("https://wttr.in/Brunswick+Heads+NSW?format=j1")
      .then((res) => res.json())
      .then((data) => {
        const current = data.current_condition?.[0];
        const today = data.weather?.[0];
        if (current && today) {
          setWeather({
            temp: parseInt(current.temp_C),
            condition: current.weatherDesc?.[0]?.value || "Unknown",
            high: parseInt(today.maxtempC),
            low: parseInt(today.mintempC),
          });
        }
      })
      .catch(console.error);

    // Update time every minute
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Format date
  const dateStr = currentTime.toLocaleDateString("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = currentTime.toLocaleTimeString("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Today's tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayTasks = tasks.filter((t) => {
    if (t.status === "done") return false;
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    return due >= today && due < tomorrow;
  });

  const overdueTasks = tasks.filter((t) => {
    if (t.status === "done") return false;
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });

  const urgentTasks = tasks.filter((t) => t.priority === "urgent" && t.status !== "done");

  const listMap = Object.fromEntries(lists.map((l) => [l.id, l]));

  // Get weather icon
  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("sun") || c.includes("clear")) return "☀️";
    if (c.includes("cloud") && c.includes("part")) return "⛅";
    if (c.includes("cloud")) return "☁️";
    if (c.includes("rain") || c.includes("shower")) return "🌧️";
    if (c.includes("storm") || c.includes("thunder")) return "⛈️";
    return "🌤️";
  };
  
  // Pants or shorts logic
  const getPantsOrShorts = () => {
    if (!weather) return null;
    const { high, low } = weather;
    
    // Simple logic based on high/low
    if (high < 20) {
      return { emoji: "👖", text: "Pants Day", reason: "Cold one today — pants weather" };
    }
    if (low >= 20 && high >= 24) {
      return { emoji: "🩳", text: "Shorts Day", reason: "Beautiful day — shorts all the way" };
    }
    if (low < 18 && high >= 24) {
      return { emoji: "🩳", text: "Shorts Day", reason: "Chilly start, but she'll warm up" };
    }
    if (high >= 20 && high <= 24) {
      return { emoji: "🩳", text: "Shorts Day", reason: "Mild day — shorts if you're game" };
    }
    if (high >= 22) {
      return { emoji: "🩳", text: "Shorts Day", reason: "Arvo's warm enough — go the shorts" };
    }
    return { emoji: "👖", text: "Pants Day", reason: "Play it safe with pants today" };
  };
  
  const legVerdict = getPantsOrShorts();

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="text-center py-8">
        <p className="text-dark-400 text-sm uppercase tracking-wider mb-2">Good morning, Heath</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{dateStr}</h1>
        <p className="text-xl text-dark-300">{timeStr}</p>
      </div>

      {/* Weather Card */}
      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">☀️</span>
          <h2 className="text-lg font-semibold text-white">Weather</h2>
          <span className="text-dark-400 text-sm ml-auto">Brunswick Heads, NSW</span>
        </div>
        {weather ? (
          <>
            <div className="flex items-center gap-6">
              <div className="text-5xl">{getWeatherIcon(weather.condition)}</div>
              <div>
                <div className="text-4xl font-light text-white">{weather.temp}°C</div>
                <div className="text-dark-300">{weather.condition}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-dark-300">
                  <span className="text-red-400">↑{weather.high}°</span>
                  <span className="mx-2">/</span>
                  <span className="text-blue-400">↓{weather.low}°</span>
                </div>
              </div>
            </div>
            {legVerdict && (
              <div className="mt-4 pt-4 border-t border-dark-700/50 flex items-center gap-3">
                <span className="text-2xl">{legVerdict.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-white">{legVerdict.text}</p>
                  <p className="text-xs text-dark-400">{legVerdict.reason}</p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-dark-400 animate-pulse">Loading weather...</div>
        )}
      </div>

      {/* Today's Focus */}
      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📋</span>
          <h2 className="text-lg font-semibold text-white">Today&apos;s Focus</h2>
        </div>

        {/* Urgent */}
        {urgentTasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-wider text-red-400 mb-2">🔴 Urgent</h3>
            <div className="space-y-2">
              {urgentTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-white text-sm">{t.title}</span>
                  {t.listId && listMap[t.listId] && (
                    <span className="text-xs text-dark-400 ml-auto">{listMap[t.listId].icon} {listMap[t.listId].name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs uppercase tracking-wider text-orange-400 mb-2">⚠️ Overdue</h3>
            <div className="space-y-2">
              {overdueTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <span className="text-white text-sm">{t.title}</span>
                  {t.listId && listMap[t.listId] && (
                    <span className="text-xs text-dark-400 ml-auto">{listMap[t.listId].icon} {listMap[t.listId].name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Due Today */}
        {todayTasks.length > 0 ? (
          <div>
            <h3 className="text-xs uppercase tracking-wider text-accent-light mb-2">📅 Due Today</h3>
            <div className="space-y-2">
              {todayTasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: t.listId && listMap[t.listId] ? listMap[t.listId].color : "#666" }}
                  />
                  <span className="text-white text-sm">{t.title}</span>
                  {t.listId && listMap[t.listId] && (
                    <span className="text-xs text-dark-400 ml-auto">{listMap[t.listId].icon} {listMap[t.listId].name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-dark-400 text-sm py-4 text-center">
            {urgentTasks.length === 0 && overdueTasks.length === 0
              ? "No tasks due today — clear schedule! 🎉"
              : "Nothing else due today"}
          </div>
        )}
      </div>

      {/* HenryII's Suggestions */}
      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🦝</span>
          <h2 className="text-lg font-semibold text-white">HenryII&apos;s Suggestions</h2>
        </div>
        <div className="space-y-3 text-dark-200 text-sm">
          <p>
            <span className="text-accent-light font-medium">💡 Productivity Tip:</span>{" "}
            Start with your most challenging task while your energy is highest. The rest of the day will feel easier.
          </p>
          <p>
            <span className="text-accent-light font-medium">📊 I can help with:</span>{" "}
            Research, drafting emails, code reviews, data analysis, or scheduling. Just ask!
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="glass p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🔗</span>
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a href="/tasks" className="p-3 bg-dark-800/50 rounded-xl text-center hover:bg-dark-800 transition-colors">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-xs text-dark-300">Tasks</div>
          </a>
          <a href="/projects" className="p-3 bg-dark-800/50 rounded-xl text-center hover:bg-dark-800 transition-colors">
            <div className="text-2xl mb-1">📁</div>
            <div className="text-xs text-dark-300">Projects</div>
          </a>
          <a href="/chat" className="p-3 bg-dark-800/50 rounded-xl text-center hover:bg-dark-800 transition-colors">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-xs text-dark-300">Chat</div>
          </a>
          <a href="/analytics" className="p-3 bg-dark-800/50 rounded-xl text-center hover:bg-dark-800 transition-colors">
            <div className="text-2xl mb-1">📈</div>
            <div className="text-xs text-dark-300">Analytics</div>
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-dark-500 text-xs py-4">
        🦝 Morning brief powered by HenryII · Telegram/Dashboard
      </div>
    </div>
  );
}
