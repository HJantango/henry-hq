"use client";

import { useEffect, useState } from "react";
import { getTasks, getProjects, updateTask, deleteTask, saveTasks } from "@/lib/store";
import { Task, Project, SubTask } from "@/lib/types";
import { priorityColors, cn } from "@/lib/utils";
import QuickAddTask from "@/components/QuickAddTask";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return d < now;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<{ priority: string; status: string; project: string; today: boolean }>({
    priority: "all",
    status: "all",
    project: "all",
    today: false,
  });
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState<Record<string, string>>({});
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);

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

  const handleDueDateChange = (id: string, date: string) => {
    updateTask(id, { dueDate: date ? new Date(date).toISOString() : undefined });
    setEditingDueDate(null);
    refresh();
  };

  const addSubtask = (taskId: string) => {
    const title = subtaskInput[taskId]?.trim();
    if (!title) return;
    const allTasks = getTasks();
    const idx = allTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      const newSub: SubTask = { id: generateId(), title, done: false, createdAt: new Date().toISOString() };
      if (!allTasks[idx].subtasks) allTasks[idx].subtasks = [];
      allTasks[idx].subtasks!.push(newSub);
      saveTasks(allTasks);
    }
    setSubtaskInput((prev) => ({ ...prev, [taskId]: "" }));
    refresh();
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    const allTasks = getTasks();
    const idx = allTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1 && allTasks[idx].subtasks) {
      const sIdx = allTasks[idx].subtasks!.findIndex((s) => s.id === subId);
      if (sIdx !== -1) {
        allTasks[idx].subtasks![sIdx].done = !allTasks[idx].subtasks![sIdx].done;
        saveTasks(allTasks);
      }
    }
    refresh();
  };

  const deleteSubtask = (taskId: string, subId: string) => {
    const allTasks = getTasks();
    const idx = allTasks.findIndex((t) => t.id === taskId);
    if (idx !== -1 && allTasks[idx].subtasks) {
      allTasks[idx].subtasks = allTasks[idx].subtasks!.filter((s) => s.id !== subId);
      saveTasks(allTasks);
    }
    refresh();
  };

  if (!mounted) return null;

  let filtered = [...tasks];
  if (filter.priority !== "all") filtered = filtered.filter((t) => t.priority === filter.priority);
  if (filter.status !== "all") filtered = filtered.filter((t) => t.status === filter.status);
  if (filter.project !== "all") filtered = filtered.filter((t) => t.projectId === filter.project);
  if (filter.today) filtered = filtered.filter((t) => isToday(t.dueDate));

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
    todayCount: tasks.filter((t) => isToday(t.dueDate) && t.status !== "done").length,
    overdue: tasks.filter((t) => isOverdue(t.dueDate) && t.status !== "done").length,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Tasks</h1>
        <p className="text-dark-300 text-sm mt-1">
          {stats.done}/{stats.total} completed
          {stats.urgent > 0 && <span className="text-red-400"> · {stats.urgent} urgent</span>}
          {stats.todayCount > 0 && <span className="text-accent-light"> · {stats.todayCount} due today</span>}
          {stats.overdue > 0 && <span className="text-orange-400"> · {stats.overdue} overdue</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter({ ...filter, today: !filter.today })}
          className={cn(
            "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
            filter.today
              ? "bg-accent/20 text-accent-light border-accent/30"
              : "bg-dark-800/50 text-dark-200 border-white/[0.08] hover:border-accent/30"
          )}
        >
          📅 Today ({stats.todayCount})
        </button>
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
        {filtered.map((task, i) => {
          const isExpanded = expandedTask === task.id;
          const subtaskCount = task.subtasks?.length || 0;
          const subtaskDone = task.subtasks?.filter((s) => s.done).length || 0;
          const taskOverdue = isOverdue(task.dueDate) && task.status !== "done";
          const taskToday = isToday(task.dueDate);

          return (
            <div
              key={task.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div
                className={cn(
                  "glass-hover p-4 flex items-center gap-4 group",
                  task.status === "done" && "opacity-50",
                  taskOverdue && "border-orange-500/20"
                )}
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
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      "text-sm font-medium",
                      task.status === "done" ? "text-dark-400 line-through" : "text-white"
                    )}>
                      {task.title}
                    </p>
                    {subtaskCount > 0 && (
                      <span className="text-[10px] text-dark-400 bg-dark-700/50 px-1.5 py-0.5 rounded">
                        {subtaskDone}/{subtaskCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {task.projectId && projectMap[task.projectId] && (
                      <span className="text-xs text-dark-400">{projectMap[task.projectId]}</span>
                    )}
                    {task.dueDate && (
                      <span className={cn(
                        "text-xs",
                        taskOverdue ? "text-orange-400" : taskToday ? "text-accent-light" : "text-dark-400"
                      )}>
                        {taskOverdue ? "⚠️ Overdue" : taskToday ? "📅 Today" : `Due ${formatDate(task.dueDate)}`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Due date button */}
                {editingDueDate === task.id ? (
                  <input
                    type="date"
                    defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                    onChange={(e) => handleDueDateChange(task.id, e.target.value)}
                    onBlur={() => setEditingDueDate(null)}
                    autoFocus
                    className="bg-dark-800 border border-accent/30 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setEditingDueDate(task.id)}
                    className="p-1 text-dark-500 hover:text-accent-light transition-colors opacity-0 group-hover:opacity-100"
                    title="Set due date"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                    </svg>
                  </button>
                )}

                {/* Expand for subtasks */}
                <button
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  className="p-1 text-dark-500 hover:text-accent-light transition-colors"
                  title="Subtasks"
                >
                  <svg className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

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

              {/* Subtasks (expanded) */}
              {isExpanded && (
                <div className="ml-9 mt-1 mb-2 space-y-1.5 animate-fade-in">
                  {/* Existing subtasks */}
                  {(task.subtasks || []).map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg bg-dark-800/30 group/sub">
                      <button
                        onClick={() => toggleSubtask(task.id, sub.id)}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all flex-shrink-0",
                          sub.done ? "bg-accent/30 border-accent/50" : "border-dark-500 hover:border-accent/50"
                        )}
                      >
                        {sub.done && (
                          <svg className="w-2.5 h-2.5 text-accent-light" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        )}
                      </button>
                      <span className={cn("text-xs flex-1", sub.done ? "text-dark-500 line-through" : "text-dark-200")}>
                        {sub.title}
                      </span>
                      <button
                        onClick={() => deleteSubtask(task.id, sub.id)}
                        className="p-0.5 text-dark-500 hover:text-red-400 transition-colors opacity-0 group-hover/sub:opacity-100"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Add subtask */}
                  <div className="flex gap-2">
                    <input
                      value={subtaskInput[task.id] || ""}
                      onChange={(e) => setSubtaskInput((prev) => ({ ...prev, [task.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubtask(task.id);
                        }
                      }}
                      placeholder="Add subtask..."
                      className="flex-1 bg-dark-900/30 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-dark-500 focus:outline-none focus:border-accent/30"
                    />
                    <button
                      onClick={() => addSubtask(task.id)}
                      className="px-2.5 py-1.5 bg-accent/15 text-accent-light rounded-lg text-xs hover:bg-accent/25 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400 text-sm">
              {filter.today ? "Nothing due today — nice! 🎉" : "No tasks match your filters"}
            </p>
          </div>
        )}
      </div>

      {/* Quick Add */}
      <QuickAddTask onAdd={refresh} />
    </div>
  );
}
