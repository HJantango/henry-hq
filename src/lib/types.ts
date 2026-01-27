export interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "completed" | "archived";
  progress: number;
  category: string;
  links: string[];
  notes: string;
  tasks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "todo" | "in-progress" | "done";
  projectId?: string;
  dueDate?: string;
  createdAt: string;
  order: number;
}

export interface Activity {
  id: string;
  type: "task_completed" | "project_updated" | "task_created" | "note_added";
  message: string;
  timestamp: string;
}

export interface TerminalMessage {
  id: string;
  type: "input" | "output" | "system";
  content: string;
  timestamp: string;
}
