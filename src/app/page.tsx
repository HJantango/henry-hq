"use client";

import { useEffect, useState } from "react";
import { formatAEST } from "@/lib/utils";
import { getProjects, getTasks, getActivities } from "@/lib/store";
import { Project, Task, Activity } from "@/lib/types";
import StatsCard from "@/components/StatsCard";
import WeatherWidget from "@/components/WeatherWidget";
import HenryStatus from "@/components/HenryStatus";
import ActivityFeed from "@/components/ActivityFeed";
import QuickAddTask from "@/components/QuickAddTask";
import DailyPicks from "@/components/DailyPicks";
import QuickLinks from "@/components/QuickLinks";

export default function Dashboard() {
  const [time, setTime] = useState(formatAEST());
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProjects(getProjects());
    setTasks(getTasks());
    setActivities(getActivities());

    const timer = setInterval(() => setTime(formatAEST()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center animate-fade-in">
          <div className="text-5xl mb-4">🦉</div>
          <p className="text-dark-300 text-sm">Loading Henry HQ...</p>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter((p) => p.status === "active").length;
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;
  const urgentTasks = tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          {time.greeting} <span className="inline-block animate-fade-in">👋</span>
        </h1>
        <p className="text-dark-300 mt-2 text-sm">
          {time.date} · <span className="text-dark-400">{time.time} AEST</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Active Projects"
          value={activeProjects}
          trend={`${projects.length} total`}
          color="accent"
          delay={100}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
          }
        />
        <StatsCard
          label="Pending Tasks"
          value={pendingTasks}
          trend={urgentTasks > 0 ? `${urgentTasks} urgent` : "All good"}
          color={urgentTasks > 0 ? "orange" : "green"}
          delay={200}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatsCard
          label="This Week"
          value={tasks.filter((t) => t.status === "done").length}
          trend="tasks completed"
          color="green"
          delay={300}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z" />
            </svg>
          }
        />
        <StatsCard
          label="Deadlines"
          value={tasks.filter((t) => t.dueDate && t.status !== "done").length}
          trend="upcoming"
          color="purple"
          delay={400}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Daily Picks - Full width, prominent */}
      <DailyPicks />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <ActivityFeed activities={activities} />
          <QuickAddTask onAdd={() => setTasks(getTasks())} />
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <HenryStatus />
          <QuickLinks />
          <WeatherWidget />
        </div>
      </div>
    </div>
  );
}
