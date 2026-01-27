"use client";

import { useState } from "react";
import { addTask } from "@/lib/store";
import { Task } from "@/lib/types";

interface QuickAddTaskProps {
  onAdd?: (task: Task) => void;
  projectId?: string;
}

export default function QuickAddTask({ onAdd, projectId }: QuickAddTaskProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const task = addTask({
      title: title.trim(),
      priority,
      status: "todo",
      projectId,
    });
    setTitle("");
    setPriority("medium");
    setOpen(false);
    onAdd?.(task);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 px-4 glass-hover text-sm text-dark-300 hover:text-white flex items-center gap-2 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add task...
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass p-4 space-y-3">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title..."
        className="w-full bg-dark-900/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-accent/40 transition-colors"
      />
      <div className="flex items-center gap-2">
        {(["low", "medium", "high", "urgent"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              priority === p
                ? p === "urgent" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                  p === "high" ? "bg-orange-500/20 text-orange-400 border-orange-500/30" :
                  p === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                  "bg-green-500/20 text-green-400 border-green-500/30"
                : "bg-dark-800/50 text-dark-400 border-white/[0.06] hover:border-white/[0.1]"
            }`}
          >
            {p}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => { setOpen(false); setTitle(""); }}
          className="px-3 py-1 text-xs text-dark-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="px-4 py-1.5 bg-accent/20 text-accent-light border border-accent/30 rounded-lg text-xs font-medium hover:bg-accent/30 transition-all disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </form>
  );
}
