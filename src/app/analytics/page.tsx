"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { getTasks, getProjects, getActivities } from "@/lib/store";
import { Task, Project, Activity } from "@/lib/types";

const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const PieChart = dynamic(() => import("recharts").then((m) => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then((m) => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((m) => m.Cell), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const tooltipStyle = {
  background: "#141c2b",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#e2e8f0",
};

function getWeekLabel(weeksAgo: number): string {
  if (weeksAgo === 0) return "This Week";
  if (weeksAgo === 1) return "Last Week";
  const d = new Date();
  d.setDate(d.getDate() - weeksAgo * 7);
  return `${d.toLocaleDateString("en-AU", { month: "short", day: "numeric" })}`;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    setMounted(true);
    setTasks(getTasks());
    setProjects(getProjects());
    setActivities(getActivities());
  }, []);

  // Compute real analytics data
  const analytics = useMemo(() => {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    // Task velocity - tasks completed per week (last 6 weeks)
    const weeklyData: { week: string; completed: number; created: number; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const completed = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      const created = tasks.filter((t) => {
        const d = new Date(t.createdAt);
        return d >= weekStart && d < weekEnd;
      }).length;

      weeklyData.push({
        week: getWeekStart(weekStart),
        label: getWeekLabel(i),
        completed,
        created,
      });
    }

    // Task status distribution
    const statusDist = [
      { name: "To Do", value: tasks.filter((t) => t.status === "todo").length, color: "#64748b" },
      { name: "In Progress", value: tasks.filter((t) => t.status === "in-progress").length, color: "#3b82f6" },
      { name: "Done", value: tasks.filter((t) => t.status === "done").length, color: "#10b981" },
    ].filter((s) => s.value > 0);

    // Priority distribution
    const priorityDist = [
      { name: "Urgent", value: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length, color: "#ef4444" },
      { name: "High", value: tasks.filter((t) => t.priority === "high" && t.status !== "done").length, color: "#f97316" },
      { name: "Medium", value: tasks.filter((t) => t.priority === "medium" && t.status !== "done").length, color: "#eab308" },
      { name: "Low", value: tasks.filter((t) => t.priority === "low" && t.status !== "done").length, color: "#22c55e" },
    ].filter((p) => p.value > 0);

    // Project progress data
    const projectProgress = projects.map((p) => ({
      name: p.name,
      progress: p.progress,
      status: p.status,
      tasks: tasks.filter((t) => t.projectId === p.id).length,
      doneTasks: tasks.filter((t) => t.projectId === p.id && t.status === "done").length,
    }));

    // Overdue tasks
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== "done").length;

    // Average tasks completed per week
    const avgVelocity = weeklyData.reduce((sum, w) => sum + w.completed, 0) / Math.max(weeklyData.filter(w => w.completed > 0).length, 1);

    // Recent activity count (last 7 days)
    const recentActivities = activities.filter((a) => {
      const d = new Date(a.timestamp);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo;
    }).length;

    return {
      totalTasks,
      doneTasks,
      completionRate,
      weeklyData,
      statusDist,
      priorityDist,
      projectProgress,
      overdue,
      avgVelocity: Math.round(avgVelocity * 10) / 10,
      recentActivities,
    };
  }, [tasks, projects, activities]);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Real-time insights from your tasks and projects</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Completion Rate", value: `${analytics.completionRate}%`, icon: "🎯", color: analytics.completionRate >= 50 ? "text-green-400" : "text-amber-400" },
          { label: "Task Velocity", value: `${analytics.avgVelocity}/wk`, icon: "⚡", color: "text-accent-light" },
          { label: "Overdue", value: analytics.overdue.toString(), icon: "⏰", color: analytics.overdue > 0 ? "text-red-400" : "text-green-400" },
          { label: "Activity (7d)", value: analytics.recentActivities.toString(), icon: "📊", color: "text-purple-400" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="glass-hover p-5 animate-slide-up"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-dark-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </div>
              <span className="text-xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Velocity Chart */}
        <div className="glass p-6 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">Task Velocity</h3>
            <p className="text-xs text-dark-400 mt-0.5">Created vs completed per week</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.weeklyData} barGap={4}>
                <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="created" fill="#475569" radius={[4, 4, 0, 0]} name="Created" />
                <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Trend */}
        <div className="glass p-6 animate-slide-up" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">Completion Trend</h3>
            <p className="text-xs text-dark-400 mt-0.5">Tasks completed over time</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weeklyData}>
                <defs>
                  <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} fill="url(#completedGradient)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Status Distribution */}
        <div className="glass p-6 animate-slide-up" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">Task Status</h3>
            <p className="text-xs text-dark-400 mt-0.5">{analytics.totalTasks} total tasks</p>
          </div>
          {analytics.statusDist.length > 0 ? (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.statusDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {analytics.statusDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {analytics.statusDist.map((s) => (
                  <div key={s.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] text-dark-400">{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40">
              <p className="text-xs text-dark-500">No tasks yet</p>
            </div>
          )}
        </div>

        {/* Priority Breakdown */}
        <div className="glass p-6 animate-slide-up" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">Open by Priority</h3>
            <p className="text-xs text-dark-400 mt-0.5">Incomplete tasks by priority</p>
          </div>
          <div className="space-y-3">
            {analytics.priorityDist.length > 0 ? (
              analytics.priorityDist.map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-dark-200">{p.name}</span>
                    <span className="text-xs text-dark-400">{p.value}</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(p.value / Math.max(...analytics.priorityDist.map(x => x.value), 1)) * 100}%`,
                        backgroundColor: p.color,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-dark-500">All tasks completed! 🎉</p>
              </div>
            )}
          </div>
        </div>

        {/* Project Health */}
        <div className="glass p-6 animate-slide-up" style={{ animationDelay: "600ms", animationFillMode: "both" }}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">Project Progress</h3>
            <p className="text-xs text-dark-400 mt-0.5">{projects.length} projects tracked</p>
          </div>
          <div className="space-y-4">
            {analytics.projectProgress.length > 0 ? (
              analytics.projectProgress.map((p) => {
                // taskProgress available for future use
                void (p.tasks > 0 ? Math.round((p.doneTasks / p.tasks) * 100) : 0);
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-dark-200 truncate mr-2">{p.name}</span>
                      <span className="text-xs text-dark-400 flex-shrink-0">{p.progress}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-1000"
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-dark-500">{p.doneTasks}/{p.tasks} tasks done</span>
                      <span className="text-[10px] text-dark-500">{p.status}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-dark-500">No projects yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
