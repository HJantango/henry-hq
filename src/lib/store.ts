"use client";

import { Project, Task, Activity, JournalEntry } from "./types";

const PROJECTS_KEY = "henryhq_projects";
const TASKS_KEY = "henryhq_tasks";
const ACTIVITIES_KEY = "henryhq_activities";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

// Default data
const defaultProjects: Project[] = [
  {
    id: "proj_1",
    name: "Wild Octave Dashboard",
    description: "Main business dashboard deployed on Railway",
    status: "active",
    progress: 65,
    category: "product",
    links: ["https://wild-octave-dashboard.up.railway.app"],
    notes: "Core dashboard for Wild Octave operations. Next: add analytics.",
    tasks: [],
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj_2",
    name: "WebCM SEO",
    description: "SEO optimization for WebCM client",
    status: "active",
    progress: 40,
    category: "client",
    links: [],
    notes: "Client work — SEO audit and implementation. Keyword research done.",
    tasks: [],
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "proj_3",
    name: "Tax Catchup",
    description: "Get all personal tax affairs sorted",
    status: "active",
    progress: 20,
    category: "personal",
    links: [],
    notes: "Need to gather all receipts and lodge overdue returns.",
    tasks: [],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

const defaultTasks: Task[] = [
  {
    id: "task_1",
    title: "Deploy Henry HQ to Railway",
    priority: "high",
    status: "in-progress",
    projectId: "proj_1",
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    order: 0,
  },
  {
    id: "task_2",
    title: "Complete keyword research report",
    priority: "high",
    status: "todo",
    projectId: "proj_2",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    order: 1,
  },
  {
    id: "task_3",
    title: "Gather 2023 tax receipts",
    priority: "urgent",
    status: "todo",
    projectId: "proj_3",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    order: 2,
  },
  {
    id: "task_4",
    title: "Add analytics page to dashboard",
    priority: "medium",
    status: "todo",
    projectId: "proj_1",
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    order: 3,
  },
  {
    id: "task_5",
    title: "Review on-page SEO implementation",
    priority: "medium",
    status: "todo",
    projectId: "proj_2",
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    order: 4,
  },
  {
    id: "task_6",
    title: "Schedule meeting with accountant",
    priority: "low",
    status: "todo",
    projectId: "proj_3",
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    order: 5,
  },
];

const defaultActivities: Activity[] = [
  {
    id: "act_1",
    type: "project_updated",
    message: "Updated Wild Octave Dashboard progress to 65%",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "act_2",
    type: "task_created",
    message: "Created task: Deploy Henry HQ to Railway",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "act_3",
    type: "task_completed",
    message: "Completed: Set up Railway CLI",
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "act_4",
    type: "note_added",
    message: "Added notes to WebCM SEO project",
    timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
];

function getFromStorage<T>(key: string, defaults: T): T {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  } catch {
    return defaults;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Projects
export function getProjects(): Project[] {
  return getFromStorage(PROJECTS_KEY, defaultProjects);
}

export function saveProjects(projects: Project[]): void {
  saveToStorage(PROJECTS_KEY, projects);
}

export function addProject(project: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  const projects = getProjects();
  const newProject: Project = {
    ...project,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  projects.push(newProject);
  saveProjects(projects);
  addActivity({
    type: "project_updated",
    message: `Created project: ${newProject.name}`,
  });
  return newProject;
}

export function updateProject(id: string, updates: Partial<Project>): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx !== -1) {
    projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
    saveProjects(projects);
  }
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  saveProjects(projects);
}

// Tasks
export function getTasks(): Task[] {
  return getFromStorage(TASKS_KEY, defaultTasks);
}

export function saveTasks(tasks: Task[]): void {
  saveToStorage(TASKS_KEY, tasks);
}

export function addTask(task: Omit<Task, "id" | "createdAt" | "order">): Task {
  const tasks = getTasks();
  const newTask: Task = {
    ...task,
    id: generateId(),
    createdAt: new Date().toISOString(),
    order: tasks.length,
  };
  tasks.push(newTask);
  saveTasks(tasks);
  addActivity({
    type: "task_created",
    message: `Created task: ${newTask.title}`,
  });
  return newTask;
}

export function updateTask(id: string, updates: Partial<Task>): void {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx !== -1) {
    const updatedTask = { ...tasks[idx], ...updates };
    if (updates.status === "done" && !updatedTask.completedAt) {
      updatedTask.completedAt = new Date().toISOString();
    }
    if (updates.status && updates.status !== "done") {
      updatedTask.completedAt = undefined;
    }
    tasks[idx] = updatedTask;
    saveTasks(tasks);
    if (updates.status === "done") {
      addActivity({
        type: "task_completed",
        message: `Completed: ${tasks[idx].title}`,
      });
    }
  }
}

// Journal entries for projects
export function addJournalEntry(projectId: string, content: string): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx !== -1) {
    const entry: JournalEntry = {
      id: generateId(),
      content,
      createdAt: new Date().toISOString(),
    };
    if (!projects[idx].journal) projects[idx].journal = [];
    projects[idx].journal!.unshift(entry);
    projects[idx].updatedAt = new Date().toISOString();
    saveProjects(projects);
    addActivity({
      type: "note_added",
      message: `Added note to ${projects[idx].name}`,
    });
  }
}

export function deleteJournalEntry(projectId: string, entryId: string): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx !== -1 && projects[idx].journal) {
    projects[idx].journal = projects[idx].journal!.filter((e) => e.id !== entryId);
    saveProjects(projects);
  }
}

export function deleteTask(id: string): void {
  const tasks = getTasks().filter((t) => t.id !== id);
  saveTasks(tasks);
}

// Activities
export function getActivities(): Activity[] {
  return getFromStorage(ACTIVITIES_KEY, defaultActivities);
}

export function addActivity(activity: Omit<Activity, "id" | "timestamp">): void {
  const activities = getActivities();
  activities.unshift({
    ...activity,
    id: generateId(),
    timestamp: new Date().toISOString(),
  });
  if (activities.length > 50) activities.pop();
  saveToStorage(ACTIVITIES_KEY, activities);
}
