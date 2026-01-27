export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

export function formatAEST(date: Date = new Date()): { time: string; date: string; greeting: string } {
  const aest = new Date(date.toLocaleString("en-US", { timeZone: "Australia/Brisbane" }));
  const hours = aest.getHours();
  
  let greeting = "Hey Heath";
  if (hours < 12) greeting = "Good morning, Heath";
  else if (hours < 17) greeting = "Good afternoon, Heath";
  else if (hours < 21) greeting = "Good evening, Heath";
  else greeting = "Hey Heath — burning the midnight oil";

  return {
    time: aest.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit", hour12: true }),
    date: aest.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    greeting,
  };
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export const priorityColors = {
  urgent: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

export const statusColors = {
  active: "bg-accent/20 text-accent-light border-accent/30",
  paused: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  archived: "bg-dark-400/20 text-dark-300 border-dark-400/30",
};

export const categoryIcons: Record<string, string> = {
  product: "🚀",
  client: "💼",
  personal: "🏠",
};
