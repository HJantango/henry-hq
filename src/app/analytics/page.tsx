"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const AreaChart = dynamic(() => import("recharts").then((m) => m.AreaChart), { ssr: false });
const Area = dynamic(() => import("recharts").then((m) => m.Area), { ssr: false });
const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), { ssr: false });

const revenueData = [
  { month: "Jan", revenue: 2400 },
  { month: "Feb", revenue: 3200 },
  { month: "Mar", revenue: 2800 },
  { month: "Apr", revenue: 4100 },
  { month: "May", revenue: 3800 },
  { month: "Jun", revenue: 5200 },
  { month: "Jul", revenue: 4900 },
];

const taskData = [
  { week: "W1", completed: 8, created: 12 },
  { week: "W2", completed: 14, created: 10 },
  { week: "W3", completed: 11, created: 8 },
  { week: "W4", completed: 16, created: 14 },
  { week: "W5", completed: 9, created: 11 },
  { week: "W6", completed: 13, created: 7 },
];

function ComingSoonBadge() {
  return (
    <span className="px-2 py-0.5 bg-accent/10 text-accent-light border border-accent/20 rounded-full text-[10px] font-medium uppercase tracking-wider">
      Coming Soon
    </span>
  );
}

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
        <p className="text-dark-300 text-sm mt-1">Insights and projections for Wild Octave</p>
      </div>

      {/* Revenue Chart */}
      <div className="glass p-6 animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-white">Revenue Trends</h3>
            <p className="text-xs text-dark-400 mt-0.5">Monthly revenue overview</p>
          </div>
          <ComingSoonBadge />
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  background: "#141c2b",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
                formatter={(value: unknown) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion */}
        <div className="glass p-6 animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Task Activity</h3>
              <p className="text-xs text-dark-400 mt-0.5">Created vs completed</p>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskData} barGap={4}>
                <XAxis dataKey="week" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#141c2b",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="created" fill="#475569" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Health */}
        <div className="glass p-6 animate-slide-up" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Project Health</h3>
              <p className="text-xs text-dark-400 mt-0.5">Status overview</p>
            </div>
            <ComingSoonBadge />
          </div>
          <div className="space-y-4">
            {[
              { name: "Wild Octave Dashboard", health: 85, color: "from-green-500 to-emerald-500" },
              { name: "WebCM SEO", health: 70, color: "from-accent to-blue-400" },
              { name: "Tax Catchup", health: 45, color: "from-yellow-500 to-orange-500" },
            ].map((project) => (
              <div key={project.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-dark-200">{project.name}</span>
                  <span className="text-xs text-dark-400">{project.health}%</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${project.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${project.health}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Avg Task Completion", value: "2.3 days", icon: "⚡", badge: true },
          { label: "Revenue Growth", value: "+23%", icon: "📈", badge: true },
          { label: "Focus Score", value: "78/100", icon: "🎯", badge: true },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className="glass-hover p-5 animate-slide-up"
            style={{ animationDelay: `${400 + i * 100}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-2xl">{stat.icon}</span>
                {stat.badge && <ComingSoonBadge />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
