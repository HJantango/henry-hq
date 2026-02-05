import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "HenryII HQ — Chaotic Co-Pilot Command Center",
  description: "Heath's personal dashboard powered by HenryII 🦝",
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🦝</text></svg>" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-900 text-dark-100 antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 lg:ml-0 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
