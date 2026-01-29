import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const TASKS_FILE = join(DATA_DIR, "tasks.json");
const LISTS_FILE = join(DATA_DIR, "lists.json");

// Default task lists
const defaultLists = [
  { id: "list_wo", name: "Wild Octave", type: "work", icon: "📊", color: "#10b981", order: 0, createdAt: new Date().toISOString() },
  { id: "list_webcm", name: "WebCM", type: "work", icon: "🌐", color: "#3b82f6", order: 1, createdAt: new Date().toISOString() },
  { id: "list_work", name: "General Work", type: "work", icon: "💼", color: "#8b5cf6", order: 2, createdAt: new Date().toISOString() },
  { id: "list_travel", name: "Travel", type: "personal", icon: "✈️", color: "#f59e0b", order: 0, createdAt: new Date().toISOString() },
  { id: "list_finance", name: "Finances", type: "personal", icon: "💰", color: "#22c55e", order: 1, createdAt: new Date().toISOString() },
  { id: "list_home", name: "Home", type: "personal", icon: "🏠", color: "#ec4899", order: 2, createdAt: new Date().toISOString() },
  { id: "list_personal", name: "General", type: "personal", icon: "🎯", color: "#6366f1", order: 3, createdAt: new Date().toISOString() },
];

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON(file: string, defaults: unknown) {
  ensureDataDir();
  if (!existsSync(file)) {
    writeFileSync(file, JSON.stringify(defaults, null, 2));
    return defaults;
  }
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return defaults;
  }
}

function writeJSON(file: string, data: unknown) {
  ensureDataDir();
  writeFileSync(file, JSON.stringify(data, null, 2));
}

// GET - retrieve tasks and lists
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // "tasks", "lists", or "all"
  
  if (type === "lists") {
    const lists = readJSON(LISTS_FILE, defaultLists);
    return NextResponse.json({ lists });
  }
  
  if (type === "tasks") {
    const tasks = readJSON(TASKS_FILE, []);
    return NextResponse.json({ tasks });
  }
  
  // Default: return both
  const tasks = readJSON(TASKS_FILE, []);
  const lists = readJSON(LISTS_FILE, defaultLists);
  return NextResponse.json({ tasks, lists });
}

// POST - save tasks or lists
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.tasks !== undefined) {
      writeJSON(TASKS_FILE, body.tasks);
    }
    
    if (body.lists !== undefined) {
      writeJSON(LISTS_FILE, body.lists);
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}

// PUT - update single task
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing task id" }, { status: 400 });
    }
    
    const tasks = readJSON(TASKS_FILE, []) as Array<{ id: string; [key: string]: unknown }>;
    const idx = tasks.findIndex((t) => t.id === id);
    
    if (idx === -1) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }
    
    tasks[idx] = { ...tasks[idx], ...updates };
    writeJSON(TASKS_FILE, tasks);
    
    return NextResponse.json({ ok: true, task: tasks[idx] });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}

// DELETE - delete task
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing task id" }, { status: 400 });
    }
    
    const tasks = readJSON(TASKS_FILE, []) as Array<{ id: string }>;
    const filtered = tasks.filter((t) => t.id !== id);
    writeJSON(TASKS_FILE, filtered);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }
}
