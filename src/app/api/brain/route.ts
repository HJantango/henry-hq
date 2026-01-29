import { NextRequest, NextResponse } from "next/server";
import brainContent from "./content.json";

export const dynamic = "force-dynamic";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
  modifiedAt?: string;
}

function findFile(tree: FileNode[], filePath: string): FileNode | null {
  for (const node of tree) {
    if (node.path === filePath) return node;
    if (node.children) {
      const found = findFile(node.children, filePath);
      if (found) return found;
    }
  }
  return null;
}

// GET - list files or read a specific file
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const filePath = url.searchParams.get("path");
  
  try {
    if (filePath) {
      // Find specific file in bundled content
      const file = findFile(brainContent.tree as FileNode[], filePath);
      
      if (!file || file.type !== "file") {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      
      return NextResponse.json({
        path: filePath,
        content: file.content,
        modifiedAt: file.modifiedAt,
      });
    } else {
      // Return folder tree (strip content to reduce payload)
      const stripContent = (nodes: FileNode[]): FileNode[] => 
        nodes.map(n => ({
          ...n,
          content: undefined,
          children: n.children ? stripContent(n.children) : undefined,
        }));
      
      return NextResponse.json({ 
        tree: stripContent(brainContent.tree as FileNode[]),
        bundled: true 
      });
    }
  } catch (error) {
    console.error("Brain API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read brain" },
      { status: 500 }
    );
  }
}
