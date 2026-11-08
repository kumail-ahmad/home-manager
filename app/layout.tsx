import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/AppContext";
import { ToastProvider } from "@/components/ToastProvider";
import AppShell from "@/components/AppShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: { default: "Home Manager", template: "%s | Home Manager" },
  description: "Private rent and expense management for Home — residents, rooms, rent, electricity, and reports.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head />
      <body className="h-full relative min-h-screen" style={{ background: "var(--ivory)" }}>
        {/* Subtle floral watermark background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: "url('/bg-floral.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right -15px bottom -15px",
            backgroundSize: "min(460px, 70vw) auto",
            opacity: 0.12,
            mixBlendMode: "multiply",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 min-h-screen flex flex-col">
          <AppProvider>
            <ToastProvider>
              <AppShell>
                {children}
              </AppShell>
            </ToastProvider>
          </AppProvider>
        </div>

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
