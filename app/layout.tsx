import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { ToastProvider } from "@/components/ToastProvider";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: { default: "Home Manager", template: "%s | Home Manager" },
  description: "Private rent and expense management for Home — residents, rooms, rent, electricity, and reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head />
      <body className="h-full" style={{ background: "var(--ivory)" }}>
        <AppProvider>
          <ToastProvider>
            <AppShell>
              {children}
            </AppShell>
          </ToastProvider>
        </AppProvider>

        <style>{`
          @media (max-width: 767px) {
            .main-offset { margin-left: 0 !important; }
          }
          @media (min-width: 768px) {
            .mobile-spacer { display: none !important; }
          }
        `}</style>
      </body>
    </html>
  );
}
