"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("fillbooks-theme", theme);
}

export function ThemeToggle() {
  // Starts "dark" to match the server-rendered markup (avoids a hydration
  // mismatch); corrected from localStorage immediately on mount, before
  // the user can perceive it -- the real flash-prevention already
  // happened via ThemeScript in <head>.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("fillbooks-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  function pick(next: Theme) {
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="flex rounded-lg border border-border bg-surface-2 p-[3px]">
      <button
        type="button"
        onClick={() => pick("dark")}
        className="flex-1 rounded-md py-1.5 text-[15px] font-semibold cursor-pointer"
        style={{
          background: theme === "dark" ? "var(--accent-soft)" : "transparent",
          color: theme === "dark" ? "var(--primary)" : "var(--text-muted)",
        }}
      >
        Dark
      </button>
      <button
        type="button"
        onClick={() => pick("light")}
        className="flex-1 rounded-md py-1.5 text-[15px] font-semibold cursor-pointer"
        style={{
          background: theme === "light" ? "var(--accent-soft)" : "transparent",
          color: theme === "light" ? "var(--primary)" : "var(--text-muted)",
        }}
      >
        Light
      </button>
    </div>
  );
}
