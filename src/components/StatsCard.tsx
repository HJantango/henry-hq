"use client";

import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: string;
  delay?: number;
}

export default function StatsCard({ label, value, icon, trend, color = "accent", delay = 0 }: StatsCardProps) {
  return (
    <div
      className="glass-hover p-5 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-dark-300 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {trend && (
            <p className={cn("text-xs mt-1", trend.startsWith("+") ? "text-green-400" : "text-dark-400")}>
              {trend}
            </p>
          )}
        </div>
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          color === "accent" ? "bg-accent/15 text-accent-light" :
          color === "green" ? "bg-green-500/15 text-green-400" :
          color === "orange" ? "bg-orange-500/15 text-orange-400" :
          "bg-purple-500/15 text-purple-400"
        )}>
          {icon}
        </div>
      </div>
    </div>
  );
}
