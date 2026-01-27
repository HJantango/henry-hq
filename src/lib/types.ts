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
  journal?: JournalEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "urgent" | "high" | "medium" | "low";
  status: "todo" | "in-progress" | "done";
  projectId?: string;
  dueDate?: string;
  parentId?: string;
  subtasks?: SubTask[];
  createdAt: string;
  completedAt?: string;
  order: number;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
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
