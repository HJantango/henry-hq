"use client";

import { useEffect, useState, useCallback } from "react";
import { Task, TaskList, SubTask } from "@/lib/types";
import { priorityColors, cn } from "@/lib/utils";

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
  const [lists, setLists] = useState<TaskList[]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"work" | "personal">("work");
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [subtaskInput, setSubtaskInput] = useState<Record<string, string>>({});
  const [editingDueDate, setEditingDueDate] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Task["priority"]>("medium");
  const [showTodayOnly, setShowTodayOnly] = useState(false);

  // Fetch data from server
  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
      setLists(data.lists || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save tasks to server
  const saveTasks = useCallback(async (newTasks: Task[]) => {
    setTasks(newTasks);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: newTasks }),
      });
    } catch (err) {
      console.error("Failed to save tasks:", err);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [fetchData]);

  const toggleDone = (id: string, currentStatus: string) => {
    const updated = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status: (currentStatus === "done" ? "todo" : "done") as Task["status"],
            completedAt: currentStatus === "done" ? undefined : new Date().toISOString(),
          }
        : t
    );
    saveTasks(updated);
  };

  const handleDelete = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  const handleDueDateChange = (id: string, date: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, dueDate: date ? new Date(date).toISOString() : undefined } : t
    );
    setEditingDueDate(null);
    saveTasks(updated);
  };

  const addSubtask = (taskId: string) => {
    const title = subtaskInput[taskId]?.trim();
    if (!title) return;
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const newSub: SubTask = { id: generateId(), title, done: false, createdAt: new Date().toISOString() };
        return { ...t, subtasks: [...(t.subtasks || []), newSub] };
      }
      return t;
    });
    setSubtaskInput((prev) => ({ ...prev, [taskId]: "" }));
    saveTasks(updated);
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId && t.subtasks) {
        return {
          ...t,
          subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  const deleteSubtask = (taskId: string, subId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId && t.subtasks) {
        return { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) };
      }
      return t;
    });
    saveTasks(updated);
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    const listId = selectedList || lists.find((l) => l.type === activeTab)?.id;
    const newTask: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      priority: newTaskPriority,
      status: "todo",
      listId,
      createdAt: new Date().toISOString(),
      order: tasks.length,
    };
    saveTasks([...tasks, newTask]);
    setNewTaskTitle("");
    setNewTaskPriority("medium");
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-dark-400">Loading tasks...</div>
      </div>
    );
  }

  // Filter lists by active tab
  const filteredLists = lists.filter((l) => l.type === activeTab);
  
  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const list = lists.find((l) => l.id === t.listId);
    if (!list) return activeTab === "work"; // Unassigned tasks go to work
    if (list.type !== activeTab) return false;
    if (selectedList && t.listId !== selectedList) return false;
    if (showTodayOnly && !isToday(t.dueDate)) return false;
    return true;
  });

  // Sort: undone first, then by priority
  const priorityWeight = { urgent: 0, high: 1, medium: 2, low: 3 };
  filteredTasks.sort((a, b) => {
    if (a.status === "done" && b.status !== "done") return 1;
    if (a.status !== "done" && b.status === "done") return -1;
    return priorityWeight[a.priority] - priorityWeight[b.priority];
  });

  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length,
    todayCount: tasks.filter((t) => isToday(t.dueDate) && t.status !== "done").length,
    overdue: tasks.filter((t) => isOverdue(t.dueDate) && t.status !== "done").length,
  };

  const listMap = Object.fromEntries(lists.map((l) => [l.id, l]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Tasks</h1>
        <p className="text-dark-300 text-sm mt-1">
          {stats.done}/{stats.total} completed
          {stats.urgent > 0 && <span className="text-red-400"> · {stats.urgent} urgent</span>}
          {stats.todayCount > 0 && <span className="text-accent-light"> · {stats.todayCount} due today</span>}
          {stats.overdue > 0 && <span className="text-orange-400"> · {stats.overdue} overdue</span>}
        </p>
      </div>

      {/* Work/Personal Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => { setActiveTab("work"); setSelectedList(null); }}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            activeTab === "work"
              ? "bg-accent/20 text-accent-light border border-accent/30"
              : "bg-dark-800/50 text-dark-300 border border-white/[0.08] hover:border-accent/20"
          )}
        >
          💼 Work
        </button>
        <button
          onClick={() => { setActiveTab("personal"); setSelectedList(null); }}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-medium transition-all",
            activeTab === "personal"
              ? "bg-accent/20 text-accent-light border border-accent/30"
              : "bg-dark-800/50 text-dark-300 border border-white/[0.08] hover:border-accent/20"
          )}
        >
          🏠 Personal
        </button>
        <div className="flex-1" />
        <button
          onClick={() => setShowTodayOnly(!showTodayOnly)}
          className={cn(
            "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
            showTodayOnly
              ? "bg-accent/20 text-accent-light border-accent/30"
              : "bg-dark-800/50 text-dark-200 border-white/[0.08] hover:border-accent/30"
          )}
        >
          📅 Today ({stats.todayCount})
        </button>
      </div>

      {/* List Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedList(null)}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
            !selectedList
              ? "bg-white/10 text-white"
              : "bg-dark-800/30 text-dark-400 hover:text-dark-200"
          )}
        >
          All
        </button>
        {filteredLists.map((list) => (
          <button
            key={list.id}
            onClick={() => setSelectedList(list.id === selectedList ? null : list.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5",
              selectedList === list.id
                ? "text-white"
                : "bg-dark-800/30 text-dark-400 hover:text-dark-200"
            )}
            style={selectedList === list.id ? { backgroundColor: `${list.color}30` } : {}}
          >
            <span>{list.icon}</span>
            <span>{list.name}</span>
            <span className="text-dark-500">
              ({tasks.filter((t) => t.listId === list.id && t.status !== "done").length})
            </span>
          </button>
        ))}
      </div>

      {/* Quick Add */}
      <div className="glass p-4 flex gap-3">
        <input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="Add a task..."
          className="flex-1 bg-dark-900/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-accent/30"
        />
        <select
          value={newTaskPriority}
          onChange={(e) => setNewTaskPriority(e.target.value as Task["priority"])}
          className="bg-dark-900/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-dark-200 focus:outline-none focus:border-accent/30"
        >
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        <select
          value={selectedList || ""}
          onChange={(e) => setSelectedList(e.target.value || null)}
          className="bg-dark-900/50 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-dark-200 focus:outline-none focus:border-accent/30"
        >
          <option value="">Select list...</option>
          {filteredLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.icon} {list.name}
            </option>
          ))}
        </select>
        <button
          onClick={addTask}
          disabled={!newTaskTitle.trim()}
          className="px-4 py-2 bg-accent/20 text-accent-light rounded-xl text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filteredTasks.map((task, i) => {
          const isExpanded = expandedTask === task.id;
          const subtaskCount = task.subtasks?.length || 0;
          const subtaskDone = task.subtasks?.filter((s) => s.done).length || 0;
          const taskOverdue = isOverdue(task.dueDate) && task.status !== "done";
          const taskToday = isToday(task.dueDate);
          const list = task.listId ? listMap[task.listId] : null;

          return (
            <div
              key={task.id}
              className="animate-slide-up"
              style={{ animationDelay: `${i * 30}ms`, animationFillMode: "both" }}
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

                {/* List indicator */}
                {list && (
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                    title={list.name}
                  />
                )}

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
                    {list && (
                      <span className="text-xs text-dark-400">{list.icon} {list.name}</span>
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

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-dark-400 text-sm">
              {showTodayOnly ? "Nothing due today — nice! 🎉" : "No tasks yet. Add one above!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
