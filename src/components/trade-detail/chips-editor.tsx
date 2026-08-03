"use client";

import { useState, useTransition } from "react";

export function ChipsEditor({
  label,
  color,
  chips,
  onChange,
}: {
  label: string;
  color: string;
  chips: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    const value = draft.trim();
    if (!value || chips.includes(value)) return;
    setDraft("");
    startTransition(() => {
      onChange([...chips, value]);
    });
  }

  function remove(chip: string) {
    startTransition(() => {
      onChange(chips.filter((c) => c !== chip));
    });
  }

  return (
    <div className="mb-3">
      <div className="text-[11px] font-bold mb-1.5" style={{ color }}>{label}</div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {chips.map((chip) => (
          <div
            key={chip}
            className="text-[11px] pl-2.5 pr-1.5 py-1 rounded-full flex items-center gap-1.5"
            style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
          >
            {chip}
            <span onClick={() => remove(chip)} className="cursor-pointer opacity-70 hover:opacity-100">×</span>
          </div>
        ))}
        {chips.length === 0 && <div className="text-[11px] text-text-muted">None tagged</div>}
      </div>
      <div className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          disabled={isPending}
          placeholder="Add..."
          className="text-[11px] px-2 py-1 rounded-md bg-surface-2 border border-border flex-1 min-w-0"
        />
        <button type="button" onClick={add} disabled={isPending} className="text-[11px] px-2 py-1 rounded-md bg-surface-2 border border-border cursor-pointer">
          Add
        </button>
      </div>
    </div>
  );
}
