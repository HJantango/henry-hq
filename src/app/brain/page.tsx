"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileNode[];
  modifiedAt?: string;
}

interface Document {
  path: string;
  content: string;
  modifiedAt: string;
}

// Folder icons
const folderIcons: Record<string, string> = {
  journals: "📔",
  concepts: "💡",
  projects: "🚀",
  decisions: "⚖️",
  reference: "📚",
};

function FolderTree({
  nodes,
  selectedPath,
  onSelect,
  depth = 0,
}: {
  nodes: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  depth?: number;
}) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    journals: true,
    concepts: true,
  });

  const toggle = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  return (
    <div className="space-y-0.5">
      {nodes.map((node) => (
        <div key={node.path}>
          {node.type === "folder" ? (
            <>
              <button
                onClick={() => toggle(node.path)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-dark-200 hover:bg-white/[0.04] transition-colors"
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
              >
                <span className="text-dark-400 text-xs transition-transform duration-200" style={{ transform: expanded[node.path] ? "rotate(90deg)" : "rotate(0deg)" }}>
                  ▶
                </span>
                <span>{folderIcons[node.name] || "📁"}</span>
                <span className="font-medium capitalize">{node.name}</span>
                <span className="ml-auto text-xs text-dark-500">{node.children?.length || 0}</span>
              </button>
              {expanded[node.path] && node.children && (
                <FolderTree
                  nodes={node.children}
                  selectedPath={selectedPath}
                  onSelect={onSelect}
                  depth={depth + 1}
                />
              )}
            </>
          ) : (
            <button
              onClick={() => onSelect(node.path)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                selectedPath === node.path
                  ? "bg-accent/20 text-accent-light"
                  : "text-dark-300 hover:bg-white/[0.04] hover:text-dark-100"
              }`}
              style={{ paddingLeft: `${depth * 12 + 28}px` }}
            >
              <span className="text-dark-500">◦</span>
              <span className="truncate">{node.name}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export default function BrainPage() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch folder tree
  useEffect(() => {
    fetch("/api/brain")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTree(data.tree || []);
        setLoading(false);
        
        // Auto-select today's journal if exists
        const today = new Date().toISOString().split("T")[0];
        const todayPath = `journals/${today}.md`;
        const hasToday = data.tree?.find((n: FileNode) => n.name === "journals")
          ?.children?.find((c: FileNode) => c.path === todayPath);
        if (hasToday) {
          setSelectedPath(todayPath);
        }
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Fetch document content
  useEffect(() => {
    if (!selectedPath) {
      setDocument(null);
      return;
    }
    
    setLoading(true);
    fetch(`/api/brain?path=${encodeURIComponent(selectedPath)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setDocument(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [selectedPath]);

  // Filter tree by search
  const filterTree = useCallback((nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();
    
    return nodes.reduce((acc: FileNode[], node) => {
      if (node.type === "file" && node.name.toLowerCase().includes(lowerQuery)) {
        acc.push(node);
      } else if (node.type === "folder" && node.children) {
        const filteredChildren = filterTree(node.children, query);
        if (filteredChildren.length > 0) {
          acc.push({ ...node, children: filteredChildren });
        }
      }
      return acc;
    }, []);
  }, []);

  const filteredTree = filterTree(tree, searchQuery);

  return (
    <div className="fixed inset-0 lg:left-64 flex bg-dark-950">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-72" : "w-0"} flex-shrink-0 border-r border-white/[0.06] bg-dark-900/50 transition-all duration-300 overflow-hidden`}>
        <div className="w-72 h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🧠</span>
              <h1 className="text-lg font-semibold text-white">Second Brain</h1>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-800/50 border border-white/[0.06] rounded-lg px-3 py-2 pl-9 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:ring-1 focus:ring-accent/50"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Tree */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading && !tree.length ? (
              <div className="text-dark-500 text-sm p-4">Loading...</div>
            ) : error ? (
              <div className="text-red-400 text-sm p-4">{error}</div>
            ) : (
              <FolderTree
                nodes={filteredTree}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />
            )}
          </div>
        </div>
      </div>

      {/* Toggle sidebar button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-dark-800 border border-white/[0.06] rounded-r-lg p-1.5 text-dark-400 hover:text-white transition-colors lg:hidden"
        style={{ left: sidebarOpen ? "17rem" : "0" }}
      >
        <svg className={`w-4 h-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {document ? (
          <div className="max-w-4xl mx-auto p-8">
            {/* Document header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {selectedPath?.split("/").pop()?.replace(".md", "")}
              </h1>
              <div className="flex items-center gap-4 text-sm text-dark-400">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  {selectedPath?.split("/")[0]}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(document.modifiedAt).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
            
            {/* Markdown content */}
            <article className="prose prose-invert prose-lg max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-h1:text-2xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-2
              prose-h2:text-xl prose-h2:mt-8
              prose-h3:text-lg
              prose-p:text-dark-200 prose-p:leading-relaxed
              prose-a:text-accent-light prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white prose-strong:font-semibold
              prose-code:text-accent-light prose-code:bg-dark-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-dark-900 prose-pre:border prose-pre:border-white/[0.06] prose-pre:rounded-lg
              prose-ul:text-dark-200 prose-ol:text-dark-200
              prose-li:marker:text-dark-500
              prose-blockquote:border-accent/50 prose-blockquote:bg-accent/5 prose-blockquote:py-1 prose-blockquote:rounded-r-lg prose-blockquote:text-dark-300
              prose-hr:border-white/10
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {document.content}
              </ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-xl font-semibold text-white mb-2">Second Brain</h2>
              <p className="text-dark-400 max-w-md">
                Select a document from the sidebar to view it here. Your knowledge base grows as we work together.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
