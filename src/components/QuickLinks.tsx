"use client";

import Link from "next/link";

const links = [
  {
    name: "Chat Log",
    href: "/chat",
    icon: "💬",
    description: "Conversation history with Henry",
    internal: true,
  },
  {
    name: "Terminal",
    href: "/terminal",
    icon: "⌨️",
    description: "Send commands to Henry",
    internal: true,
  },
  {
    name: "Wild Octave",
    href: "https://wild-octave-august-production-a54e.up.railway.app",
    icon: "🐙",
    description: "Production dashboard",
    internal: false,
  },
];

export default function QuickLinks() {
  return (
    <div
      className="glass-hover p-5 animate-slide-up"
      style={{ animationDelay: "400ms", animationFillMode: "both" }}
    >
      <p className="text-xs font-medium text-dark-300 uppercase tracking-wider mb-3">
        Quick Links
      </p>
      <div className="space-y-2">
        {links.map((link) => {
          const inner = (
            <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-200 group cursor-pointer">
              <span className="text-lg">{link.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white group-hover:text-accent-light transition-colors">
                  {link.name}
                </p>
                <p className="text-xs text-dark-400 truncate">{link.description}</p>
              </div>
              <svg
                className="w-4 h-4 text-dark-500 group-hover:text-accent-light transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                {link.internal ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                )}
              </svg>
            </div>
          );

          return link.internal ? (
            <Link key={link.name} href={link.href}>
              {inner}
            </Link>
          ) : (
            <a key={link.name} href={link.href} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          );
        })}
      </div>
    </div>
  );
}
