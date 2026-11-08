"use client";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "warn" | "info";
interface Toast { id: string; type: ToastType; message: string; }
interface ToastCtx { toast: (msg: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const c = useContext(ToastContext);
  if (!c) throw new Error("useToast must be inside ToastProvider");
  return c;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, type, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  const iconMap: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle className="h-4 w-4 shrink-0" />,
    error:   <XCircle     className="h-4 w-4 shrink-0" />,
    warn:    <AlertTriangle className="h-4 w-4 shrink-0" />,
    info:    <CheckCircle className="h-4 w-4 shrink-0" />,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`} role="status" aria-live="polite">
            {iconMap[t.type]}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification">
              <X className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
