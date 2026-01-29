"use client";

import { useState, useEffect } from "react";

interface Friend {
  id: string;
  name: string;
  started: string;
  notes: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "advanced";
  timeEstimate: string;
  details?: string[];
  links?: { label: string; url: string }[];
}

const CHECKLIST: ChecklistItem[] = [
  // Infrastructure
  {
    id: "vps",
    category: "Infrastructure",
    title: "Set up VPS/Server",
    description: "Get a cloud server to run Clawdbot 24/7",
    difficulty: "medium",
    timeEstimate: "30 min",
    details: [
      "Recommended: AWS Lightsail, DigitalOcean, or Vultr",
      "Minimum: 2GB RAM, 1 vCPU, 20GB disk",
      "Recommended: 4GB RAM for local embeddings",
      "Ubuntu 22.04 LTS recommended",
      "Enable SSH access with key-based auth",
    ],
    links: [
      { label: "AWS Lightsail", url: "https://lightsail.aws.amazon.com" },
      { label: "DigitalOcean", url: "https://digitalocean.com" },
    ],
  },
  {
    id: "node",
    category: "Infrastructure",
    title: "Install Node.js 22+",
    description: "Clawdbot requires Node.js 22 or later",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -",
      "sudo apt-get install -y nodejs",
      "Verify: node --version (should show v22.x.x)",
    ],
  },
  {
    id: "clawdbot-install",
    category: "Infrastructure",
    title: "Install Clawdbot",
    description: "Install Clawdbot globally via npm",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "npm install -g clawdbot",
      "clawdbot onboard (follow the wizard)",
      "clawdbot gateway start",
      "clawdbot gateway enable (for auto-start on boot)",
    ],
    links: [
      { label: "Clawdbot Docs", url: "https://docs.clawd.bot" },
      { label: "Discord Community", url: "https://discord.com/invite/clawd" },
    ],
  },
  {
    id: "anthropic-key",
    category: "Infrastructure",
    title: "Add Anthropic API Key",
    description: "Connect Claude as your AI model",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "Get API key from console.anthropic.com",
      "clawdbot auth add anthropic",
      "Paste your API key when prompted",
    ],
    links: [
      { label: "Anthropic Console", url: "https://console.anthropic.com" },
    ],
  },

  // Security
  {
    id: "firewall",
    category: "Security",
    title: "Enable UFW Firewall",
    description: "Block unwanted traffic, allow only needed ports",
    difficulty: "easy",
    timeEstimate: "10 min",
    details: [
      "sudo ufw default deny incoming",
      "sudo ufw default allow outgoing",
      "sudo ufw allow ssh",
      "sudo ufw allow 18789 (gateway port)",
      "sudo ufw enable",
    ],
  },
  {
    id: "fail2ban",
    category: "Security",
    title: "Install fail2ban",
    description: "Auto-ban IPs after failed SSH attempts",
    difficulty: "easy",
    timeEstimate: "10 min",
    details: [
      "sudo apt install fail2ban",
      "sudo systemctl enable fail2ban",
      "sudo systemctl start fail2ban",
      "Default: 3 failures = 24h ban",
    ],
  },
  {
    id: "credentials-perms",
    category: "Security",
    title: "Lock Down Credential Permissions",
    description: "Ensure sensitive files are only readable by you",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "chmod 700 ~/.clawdbot",
      "chmod 700 ~/.clawdbot/credentials",
      "chmod 600 ~/.clawdbot/credentials/*",
      "Any google-tokens.json: chmod 600",
    ],
  },
  {
    id: "tailscale",
    category: "Security",
    title: "Set up Tailscale (Optional)",
    description: "Private VPN for secure access to your server",
    difficulty: "medium",
    timeEstimate: "15 min",
    details: [
      "Creates private network between your devices",
      "Access server without exposing ports publicly",
      "curl -fsSL https://tailscale.com/install.sh | sh",
      "sudo tailscale up",
    ],
    links: [
      { label: "Tailscale", url: "https://tailscale.com" },
    ],
  },

  // WhatsApp
  {
    id: "whatsapp-connect",
    category: "WhatsApp",
    title: "Connect WhatsApp",
    description: "Link your WhatsApp account to Clawdbot",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "clawdbot channels whatsapp qr",
      "Scan QR code with WhatsApp on your phone",
      "Link a second device (like Clawdbot)",
      "clawdbot status to verify connection",
    ],
  },
  {
    id: "whatsapp-selfchat",
    category: "WhatsApp",
    title: "Enable Self-Chat Mode",
    description: "Talk to Henry in your own WhatsApp 'Notes' chat",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "In clawdbot.json, set: channels.whatsapp.selfChatMode: true",
      "Also set: channels.whatsapp.dmPolicy: 'allowlist'",
      "Add your number to: channels.whatsapp.allowFrom: ['+1234567890']",
      "Send yourself a message to test!",
    ],
  },

  // Memory & Intelligence
  {
    id: "workspace",
    category: "Memory & Intelligence",
    title: "Set Up Workspace",
    description: "Create the agent workspace with memory files",
    difficulty: "easy",
    timeEstimate: "10 min",
    details: [
      "mkdir -p ~/clawd/memory",
      "Create AGENTS.md, SOUL.md, MEMORY.md, USER.md",
      "Copy templates from Clawdbot docs or Heath's setup",
      "Set workspace path in clawdbot.json",
    ],
  },
  {
    id: "openai-embeddings",
    category: "Memory & Intelligence",
    title: "Add OpenAI Key for Memory Search",
    description: "Enable semantic memory search with embeddings",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "clawdbot auth add openai",
      "Get key from platform.openai.com/api-keys",
      "Memory search uses text-embedding-3-small (~$0.02/1M tokens)",
      "Enable in config: agents.defaults.memorySearch.enabled: true",
    ],
    links: [
      { label: "OpenAI API Keys", url: "https://platform.openai.com/api-keys" },
    ],
  },
  {
    id: "session-memory",
    category: "Memory & Intelligence",
    title: "Enable Session Memory",
    description: "Allow Henry to search past conversations",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      'In memorySearch.sources, add: ["memory", "sessions"]',
      "Set memorySearch.experimental.sessionMemory: true",
      "clawdbot memory index --source sessions",
    ],
  },

  // Voice
  {
    id: "whisper",
    category: "Voice",
    title: "Set Up Whisper for Voice Transcription",
    description: "Transcribe voice messages locally",
    difficulty: "medium",
    timeEstimate: "20 min",
    details: [
      "python3 -m venv ~/whisper-env",
      "source ~/whisper-env/bin/activate",
      "pip install openai-whisper",
      "sudo apt install ffmpeg",
      "Clawdbot auto-detects and uses for audio",
    ],
  },

  // Integrations
  {
    id: "google-oauth",
    category: "Integrations",
    title: "Google Calendar & Gmail",
    description: "Connect Google for calendar events and email",
    difficulty: "advanced",
    timeEstimate: "30 min",
    details: [
      "Create project in Google Cloud Console",
      "Enable Gmail API and Calendar API",
      "Create OAuth 2.0 credentials (Desktop app)",
      "Download client_secret.json",
      "Set up auth flow to get refresh token",
      "Store tokens securely in workspace",
    ],
    links: [
      { label: "Google Cloud Console", url: "https://console.cloud.google.com" },
    ],
  },
  {
    id: "railway",
    category: "Integrations",
    title: "Railway CLI",
    description: "Deploy apps and dashboards to Railway",
    difficulty: "medium",
    timeEstimate: "15 min",
    details: [
      "npm install -g @railway/cli",
      "railway login",
      "railway link (to connect projects)",
      "railway up (to deploy)",
    ],
    links: [
      { label: "Railway", url: "https://railway.app" },
    ],
  },
  {
    id: "github",
    category: "Integrations",
    title: "GitHub CLI",
    description: "Manage repos, PRs, and issues",
    difficulty: "easy",
    timeEstimate: "10 min",
    details: [
      "sudo apt install gh",
      "gh auth login (choose HTTPS + browser)",
      "gh repo clone <repo>",
    ],
    links: [
      { label: "GitHub CLI", url: "https://cli.github.com" },
    ],
  },

  // HenryHQ
  {
    id: "henryhq-clone",
    category: "Henry HQ Dashboard",
    title: "Clone Henry HQ",
    description: "Get the personal dashboard codebase",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "gh repo clone HJantango/henry-hq",
      "cd henry-hq && npm install",
      "cp .env.example .env.local",
      "npm run dev (local development)",
    ],
  },
  {
    id: "henryhq-deploy",
    category: "Henry HQ Dashboard",
    title: "Deploy to Railway",
    description: "Get your dashboard live on the web",
    difficulty: "medium",
    timeEstimate: "15 min",
    details: [
      "railway init (in henry-hq folder)",
      "Set env vars: CLAWDBOT_GATEWAY_URL, CLAWDBOT_GATEWAY_TOKEN",
      "railway up",
      "railway domain (to get public URL)",
    ],
  },
  {
    id: "henryhq-customize",
    category: "Henry HQ Dashboard",
    title: "Customize Your Dashboard",
    description: "Make it yours — change name, colors, features",
    difficulty: "easy",
    timeEstimate: "30 min",
    details: [
      "Update agent name in components",
      "Change emoji/avatar",
      "Customize weather location",
      "Add/remove pages as needed",
    ],
  },

  // Advanced
  {
    id: "heartbeat",
    category: "Advanced",
    title: "Configure Heartbeats",
    description: "Periodic check-ins for proactive assistance",
    difficulty: "easy",
    timeEstimate: "10 min",
    details: [
      "Set heartbeat.every in clawdbot.json (e.g., '30m')",
      "Create HEARTBEAT.md with check instructions",
      "Henry will check in periodically and do background work",
    ],
  },
  {
    id: "cron-reminders",
    category: "Advanced",
    title: "Set Up Cron Reminders",
    description: "Schedule recurring tasks and reminders",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "Ask Henry to set a reminder via chat",
      "Or use: clawdbot cron add 'Reminder text' --at '9am'",
      "Supports: daily, weekly, specific times",
    ],
  },
  {
    id: "subagents",
    category: "Advanced",
    title: "Enable Sub-Agents",
    description: "Let Henry spawn background workers for long tasks",
    difficulty: "easy",
    timeEstimate: "5 min",
    details: [
      "Set agents.defaults.subagents.maxConcurrent: 8",
      "Henry can spin up workers for deployments, research, etc.",
      "Workers report back when done",
    ],
  },
];

const CATEGORIES = [
  "Infrastructure",
  "Security",
  "WhatsApp",
  "Memory & Intelligence",
  "Voice",
  "Integrations",
  "Henry HQ Dashboard",
  "Advanced",
];

const DIFFICULTY_COLORS = {
  easy: "text-green-400 bg-green-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  advanced: "text-red-400 bg-red-400/10",
};

export default function SetupGuidePage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<Record<string, string[]>>({});
  const [newFriendName, setNewFriendName] = useState("");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedFriends = localStorage.getItem("setup-friends");
    const savedCompleted = localStorage.getItem("setup-completed");
    if (savedFriends) setFriends(JSON.parse(savedFriends));
    if (savedCompleted) setCompletedItems(JSON.parse(savedCompleted));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("setup-friends", JSON.stringify(friends));
      localStorage.setItem("setup-completed", JSON.stringify(completedItems));
    }
  }, [friends, completedItems, mounted]);

  const addFriend = () => {
    if (!newFriendName.trim()) return;
    const newFriend: Friend = {
      id: Date.now().toString(),
      name: newFriendName.trim(),
      started: new Date().toISOString().split("T")[0],
      notes: "",
    };
    setFriends([...friends, newFriend]);
    setCompletedItems({ ...completedItems, [newFriend.id]: [] });
    setSelectedFriend(newFriend.id);
    setNewFriendName("");
  };

  const toggleComplete = (friendId: string, itemId: string) => {
    const current = completedItems[friendId] || [];
    const updated = current.includes(itemId)
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    setCompletedItems({ ...completedItems, [friendId]: updated });
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems(
      expandedItems.includes(itemId)
        ? expandedItems.filter((id) => id !== itemId)
        : [...expandedItems, itemId]
    );
  };

  const getProgress = (friendId: string) => {
    const completed = completedItems[friendId]?.length || 0;
    return Math.round((completed / CHECKLIST.length) * 100);
  };

  const removeFriend = (friendId: string) => {
    setFriends(friends.filter((f) => f.id !== friendId));
    const newCompleted = { ...completedItems };
    delete newCompleted[friendId];
    setCompletedItems(newCompleted);
    if (selectedFriend === friendId) setSelectedFriend(null);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-5xl animate-pulse">🦉</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          🛠️ Clawdbot Setup Guide
        </h1>
        <p className="text-dark-300">
          Help friends set up their own Henry. Track progress for each person.
        </p>
      </div>

      {/* Friends List */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Friends</h2>
        <div className="flex flex-wrap gap-3 mb-4">
          {friends.map((friend) => (
            <button
              key={friend.id}
              onClick={() => setSelectedFriend(friend.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-3 transition-all ${
                selectedFriend === friend.id
                  ? "bg-electric-blue text-white"
                  : "bg-dark-700 text-dark-200 hover:bg-dark-600"
              }`}
            >
              <span>{friend.name}</span>
              <span className="text-xs opacity-75">{getProgress(friend.id)}%</span>
            </button>
          ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={newFriendName}
              onChange={(e) => setNewFriendName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFriend()}
              placeholder="Add friend..."
              className="px-3 py-2 rounded-lg bg-dark-700 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-electric-blue"
            />
            <button
              onClick={addFriend}
              className="px-4 py-2 rounded-lg bg-electric-blue text-white hover:bg-electric-blue/80"
            >
              +
            </button>
          </div>
        </div>

        {selectedFriend && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-dark-600">
            <div className="flex-1">
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-electric-blue to-cyan-400 transition-all duration-500"
                  style={{ width: `${getProgress(selectedFriend)}%` }}
                />
              </div>
            </div>
            <span className="text-white font-medium">
              {completedItems[selectedFriend]?.length || 0} / {CHECKLIST.length}
            </span>
            <button
              onClick={() => removeFriend(selectedFriend)}
              className="text-red-400 hover:text-red-300 text-sm"
            >
              Remove
            </button>
          </div>
        )}
      </div>

      {/* Checklist */}
      {selectedFriend ? (
        <div className="space-y-6">
          {CATEGORIES.map((category) => {
            const items = CHECKLIST.filter((item) => item.category === category);
            const categoryCompleted = items.filter((item) =>
              completedItems[selectedFriend]?.includes(item.id)
            ).length;

            return (
              <div key={category} className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{category}</h3>
                  <span className="text-dark-300 text-sm">
                    {categoryCompleted} / {items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {items.map((item) => {
                    const isCompleted = completedItems[selectedFriend]?.includes(item.id);
                    const isExpanded = expandedItems.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`border rounded-lg transition-all ${
                          isCompleted
                            ? "border-green-500/30 bg-green-500/5"
                            : "border-dark-600 bg-dark-800/50"
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <button
                              onClick={() => toggleComplete(selectedFriend, item.id)}
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isCompleted
                                  ? "bg-green-500 border-green-500 text-white"
                                  : "border-dark-400 hover:border-electric-blue"
                              }`}
                            >
                              {isCompleted && <span className="text-xs">✓</span>}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span
                                  className={`font-medium ${
                                    isCompleted ? "text-dark-300 line-through" : "text-white"
                                  }`}
                                >
                                  {item.title}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${DIFFICULTY_COLORS[item.difficulty]}`}
                                >
                                  {item.difficulty}
                                </span>
                                <span className="text-xs text-dark-400">
                                  ~{item.timeEstimate}
                                </span>
                              </div>
                              <p className="text-dark-300 text-sm">{item.description}</p>
                            </div>
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className="text-dark-400 hover:text-white"
                            >
                              {isExpanded ? "▲" : "▼"}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-0 border-t border-dark-600 mt-2">
                            <div className="pt-3 pl-8 space-y-2">
                              {item.details?.map((detail, i) => (
                                <p key={i} className="text-sm text-dark-200 font-mono">
                                  {detail}
                                </p>
                              ))}
                              {item.links && (
                                <div className="flex gap-3 mt-3">
                                  {item.links.map((link) => (
                                    <a
                                      key={link.url}
                                      href={link.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-electric-blue hover:underline"
                                    >
                                      {link.label} ↗
                                    </a>
                                  ))}
                                </div>
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
          })}
        </div>
      ) : (
        <div className="glass-card p-12 text-center">
          <p className="text-dark-300 text-lg mb-4">
            Select a friend or add a new one to track their setup progress
          </p>
          <p className="text-dark-400">
            The checklist covers everything from VPS setup to full Henry HQ deployment
          </p>
        </div>
      )}
    </div>
  );
}
