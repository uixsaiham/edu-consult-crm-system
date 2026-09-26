"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";

/** Minimal toast: `const [toast, show] = useToast();`, render `{toast}`, call `show(text)` or `show(text, "error")`. */
export function useToast(duration = 2600) {
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(
    (text: string, tone: "success" | "error" = "success") => {
      clearTimeout(timer.current);
      setMessage({ text, tone });
      timer.current = setTimeout(() => setMessage(null), duration);
    },
    [duration]
  );

  useEffect(() => () => clearTimeout(timer.current), []);

  const node = message ? (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in fixed bottom-6 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-medium text-background shadow-2xl"
    >
      {message.tone === "error" ? <CircleAlert className="size-4 text-danger" /> : <CheckCircle2 className="size-4 text-success" />}
      {message.text}
    </div>
  ) : null;

  return [node, show] as const;
}
