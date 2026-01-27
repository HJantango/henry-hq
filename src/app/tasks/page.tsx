"use client";

import { useEffect, useState } from "react";
import { getTasks, getProjects, updateTask, deleteTask } from "@/lib/store";
import { Task, Project } from "@/lib/types";
import { priorityColors, cn, formatRelativeTime } from "@/lib/utils";
import QuickAddTask from "@/components/QuickAddTask";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<{ priority: string; status: string; project: string }>({
    priority: "all",
    status: "all",
    project: "all",
  });

  useEffect(() => {
    setMounted(true);
    setTasks(getTasks());
    setProjects(getProjects());
  }, []);

  const refresh = () => {
    setTasks(getTasks());
    setProjects(getProjects());
  };

  const toggleDone = (id: string, currentStatus: string) => {
    updateTask(id, { status: currentStatus === "done" ? "todo" : "done" });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteTask(id);
    refresh();
  };

  if (!mounted) return null;

  let filtered = [...tasks];
  if (filter.priority !== "all") filtered = filtered.filter((t) => t.priority === filter.priority);
  if (filter.status !== "all") filtered = filtered.filter((t) => t.status === filter.status);
  if (filter.project !== "all") filtered = filtered.filter((t) => t.projectId === filter.project);

  // Sort: undone first, then by priority weight
  const priorityWeight = { urgent: 0, high: 1, medium: 2, low: 3 };
  filtered.sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Tasks</h1>
        <p className="text-dark-300 text-sm mt-1">
          {stats.done}/{stats.total} completed
          {stats.urgent > 0 && <span className="text-red-400"> · {stats.urgent} urgent</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="bg-dark-800/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-dark-200 focus:outline-none focus:border-accent/40"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filter.priority}
          onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
          className="bg-dark-800/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-dark-200 focus:outline-none focus:border-accent/40"
        >
          <option value="all">All Priority</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={filter.project}
          onChange={(e) => setFilter({ ...filter, project: e.target.value })}
          className="bg-dark-800/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-dark-200 focus:outline-none focus:border-accent/40"
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.map((task, i) => (
          <div
            key={task.id}
            className={cn(
              "glass-hover p-4 flex items-center gap-4 group animate-slide-up",
              task.status === "done" && "opacity-50"
            )}
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleDone(task.id, task.status)}
              className={cn(
                "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0",
                task.status === "done"
                  ? "bg-accent/30 border-accent/50"
                  : "border-dark-500 hover:border-accent/50"
              )}
            >
              {task.status === "done" && (
                <svg className="w-3 h-3 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              )}
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-medium",
                task.status === "done" ? "text-dark-400 line-through" : "text-white"
              )}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {task.projectId && projectMap[task.projectId] && (
                  <span className="text-xs text-dark-400">{projectMap[task.projectId]}</span>
                )}
                {task.dueDate && (
                  <span className="text-xs text-dark-400">
                    Due {formatRelativeTime(task.dueDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Priority */}
            <span className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium border flex-shrink-0",
              priorityColors[task.priority]
            )}>
              {task.priority}
            </span>

            {/* Delete */}
            <button
              onClick={() => handleDelete(task.id)}
              className="p-1 text-dark-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400 text-sm">No tasks match your filters</p>
          </div>
        )}
      </div>

      {/* Quick Add */}
      <QuickAddTask onAdd={refresh} />
    </div>
  );
}
