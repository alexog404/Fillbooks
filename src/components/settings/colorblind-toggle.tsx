"use client";

import { useEffect, useState } from "react";

export function ColorblindToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(localStorage.getItem("fillbooks-colorblind") === "1");
  }, []);

  function pick(next: boolean) {
    setEnabled(next);
    document.documentElement.classList.toggle("colorblind", next);
    localStorage.setItem("fillbooks-colorblind", next ? "1" : "0");
  }

  return (
    <div className="flex rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => pick(false)}
        className="px-3 py-2 text-xs font-semibold cursor-pointer"
        style={{ background: !enabled ? "var(--accent-soft)" : "transparent", color: !enabled ? "var(--primary)" : "var(--text-muted)" }}
      >
        Green / Red
      </button>
      <button
        type="button"
        onClick={() => pick(true)}
        className="px-3 py-2 text-xs font-semibold cursor-pointer"
        style={{ background: enabled ? "var(--accent-soft)" : "transparent", color: enabled ? "var(--primary)" : "var(--text-muted)" }}
      >
        Blue / Orange
      </button>
    </div>
  );
}
