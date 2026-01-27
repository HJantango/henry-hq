"use client";

import { useEffect, useState } from "react";
import { getProjects, addProject, updateProject, deleteProject, addJournalEntry, deleteJournalEntry } from "@/lib/store";
import { Project } from "@/lib/types";
import { formatRelativeTime, statusColors, categoryIcons, cn } from "@/lib/utils";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [journalInput, setJournalInput] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", description: "", category: "product", status: "active" as Project["status"] });

  useEffect(() => {
    setMounted(true);
    setProjects(getProjects());
  }, []);

  const refresh = () => setProjects(getProjects());

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addProject({
      name: form.name,
      description: form.description,
      status: form.status,
      progress: 0,
      category: form.category,
      links: [],
      notes: "",
      tasks: [],
    });
    setForm({ name: "", description: "", category: "product", status: "active" });
    setShowAdd(false);
    refresh();
  };

  const handleStatusChange = (id: string, status: Project["status"]) => {
    updateProject(id, { status });
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteProject(id);
    refresh();
  };

  const handleProgressChange = (id: string, progress: number) => {
    updateProject(id, { progress });
    refresh();
  };

  const handleAddJournal = (projectId: string) => {
    const content = journalInput[projectId]?.trim();
    if (!content) return;
    addJournalEntry(projectId, content);
    setJournalInput((prev) => ({ ...prev, [projectId]: "" }));
    refresh();
  };

  const handleDeleteJournal = (projectId: string, entryId: string) => {
    deleteJournalEntry(projectId, entryId);
    refresh();
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Projects</h1>
          <p className="text-dark-300 text-sm mt-1">{projects.length} projects · {projects.filter(p => p.status === "active").length} active</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2.5 bg-accent/20 text-accent-light border border-accent/30 rounded-xl text-sm font-medium hover:bg-accent/30 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="glass p-6 space-y-4 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Project name..."
              className="bg-dark-900/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-accent/40 transition-colors"
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="bg-dark-900/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-accent/40 transition-colors"
            >
              <option value="product">🚀 Product</option>
              <option value="client">💼 Client</option>
              <option value="personal">🏠 Personal</option>
            </select>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description..."
            rows={2}
            className="w-full bg-dark-900/50 border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-400 focus:outline-none focus:border-accent/40 transition-colors resize-none"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-dark-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-dark transition-colors">Create</button>
          </div>
        </form>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project, i) => {
          const isExpanded = expandedProject === project.id;
          return (
            <div
              key={project.id}
              className={cn(
                "glass-hover p-5 space-y-4 animate-slide-up group",
                isExpanded && "md:col-span-2 xl:col-span-2"
              )}
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{categoryIcons[project.category] || "📁"}</span>
                  <div>
                    <h3 className="font-semibold text-white text-sm">{project.name}</h3>
                    <p className="text-xs text-dark-400 mt-0.5">{project.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                    className="p-1 text-dark-400 hover:text-accent-light transition-colors"
                    title={isExpanded ? "Collapse" : "Show journal"}
                  >
                    <svg className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1 text-dark-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <select
                  value={project.status}
                  onChange={(e) => handleStatusChange(project.id, e.target.value as Project["status"])}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium border appearance-none cursor-pointer",
                    statusColors[project.status]
                  )}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <span className="text-xs text-dark-400">Updated {formatRelativeTime(project.updatedAt)}</span>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-dark-300">Progress</span>
                  <span className="text-xs text-dark-400">{project.progress}%</span>
                </div>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-accent-light rounded-full transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={project.progress}
                  onChange={(e) => handleProgressChange(project.id, parseInt(e.target.value))}
                  className="w-full mt-1 accent-accent h-0.5 opacity-0 group-hover:opacity-50 transition-opacity cursor-pointer"
                />
              </div>

              {/* Links */}
              {project.links.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {project.links.map((link, j) => (
                    <a
                      key={j}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-light hover:text-white transition-colors flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                      {new URL(link).hostname}
                    </a>
                  ))}
                </div>
              )}

              {/* Journal Section (Expanded) */}
              {isExpanded && (
                <div className="border-t border-white/[0.06] pt-4 mt-4 space-y-3 animate-fade-in">
                  <h4 className="text-xs font-semibold text-dark-300 uppercase tracking-wider flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    Project Journal
                  </h4>

                  {/* Add entry */}
                  <div className="flex gap-2">
                    <input
                      value={journalInput[project.id] || ""}
                      onChange={(e) => setJournalInput((prev) => ({ ...prev, [project.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddJournal(project.id);
                        }
                      }}
                      placeholder="Jot down an idea..."
                      className="flex-1 bg-dark-900/50 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-dark-500 focus:outline-none focus:border-accent/40 transition-colors"
                    />
                    <button
                      onClick={() => handleAddJournal(project.id)}
                      className="px-3 py-2 bg-accent/20 text-accent-light rounded-lg text-xs hover:bg-accent/30 transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Journal entries */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {(project.journal || []).length === 0 ? (
                      <p className="text-xs text-dark-500 italic py-2">No journal entries yet. Start capturing ideas!</p>
                    ) : (
                      (project.journal || []).map((entry) => (
                        <div key={entry.id} className="flex gap-2 p-2 rounded-lg bg-white/[0.02] group/entry">
                          <div className="flex-1">
                            <p className="text-xs text-dark-200">{entry.content}</p>
                            <p className="text-[10px] text-dark-500 mt-1">{formatRelativeTime(entry.createdAt)}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteJournal(project.id, entry.id)}
                            className="p-1 text-dark-500 hover:text-red-400 transition-colors opacity-0 group-hover/entry:opacity-100 self-start"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
