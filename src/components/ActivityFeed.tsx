"use client";

import { Activity } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const typeIcons: Record<Activity["type"], string> = {
  task_completed: "✅",
  project_updated: "📁",
  task_created: "📝",
  note_added: "💬",
};

interface ActivityFeedProps {
  activities: Activity[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div
      className="glass p-5 animate-slide-up"
      style={{ animationDelay: "500ms", animationFillMode: "both" }}
    >
      <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {activities.slice(0, 8).map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 group"
          >
            <span className="text-sm mt-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
              {typeIcons[activity.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-dark-200 truncate">{activity.message}</p>
              <p className="text-xs text-dark-400 mt-0.5">{formatRelativeTime(activity.timestamp)}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-dark-400 text-center py-4">No activity yet</p>
        )}
      </div>
    </div>
  );
}
