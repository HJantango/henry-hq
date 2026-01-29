import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

// Path to the second-brain folder - configurable via env
const BRAIN_PATH = process.env.SECOND_BRAIN_PATH || "/home/ubuntu/clawd/second-brain";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  modifiedAt?: string;
}

function buildTree(dirPath: string, basePath: string = ""): FileNode[] {
  if (!existsSync(dirPath)) return [];
  
  const items = readdirSync(dirPath);
  const nodes: FileNode[] = [];
  
  for (const item of items) {
    if (item.startsWith(".")) continue; // Skip hidden files
    
    const fullPath = join(dirPath, item);
    const relativePath = join(basePath, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      nodes.push({
        name: item,
        path: relativePath,
        type: "folder",
        children: buildTree(fullPath, relativePath),
      });
    } else if (item.endsWith(".md")) {
      nodes.push({
        name: item.replace(".md", ""),
        path: relativePath,
        type: "file",
        modifiedAt: stat.mtime.toISOString(),
      });
    }
  }
  
  // Sort: folders first, then alphabetically
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

// GET - list files or read a specific file
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");
  
  try {
    if (filePath) {
      // Read specific file
      const fullPath = join(BRAIN_PATH, filePath);
      
      // Security: ensure path doesn't escape brain folder
      if (!fullPath.startsWith(BRAIN_PATH)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }
      
      if (!existsSync(fullPath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      
      const content = readFileSync(fullPath, "utf-8");
      const stat = statSync(fullPath);
      
      return NextResponse.json({
        path: filePath,
        content,
        modifiedAt: stat.mtime.toISOString(),
      });
    } else {
      // Return folder tree
      const tree = buildTree(BRAIN_PATH);
      return NextResponse.json({ tree, basePath: BRAIN_PATH });
    }
  } catch (error) {
    console.error("Brain API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read brain" },
      { status: 500 }
    );
  }
}
