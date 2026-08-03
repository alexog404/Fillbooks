"use client";

import { useEffect, useState } from "react";

const TIMEZONES = ["ET", "CT", "MT", "PT"] as const;
type Timezone = (typeof TIMEZONES)[number];
const LABELS: Record<Timezone, string> = { ET: "Eastern (ET)", CT: "Central (CT)", MT: "Mountain (MT)", PT: "Pacific (PT)" };

export function TimezonePicker() {
  const [tz, setTz] = useState<Timezone>("ET");

  useEffect(() => {
    const stored = localStorage.getItem("fillbooks-timezone");
    if (stored && (TIMEZONES as readonly string[]).includes(stored)) setTz(stored as Timezone);
  }, []);

  function cycle() {
    const next = TIMEZONES[(TIMEZONES.indexOf(tz) + 1) % TIMEZONES.length];
    setTz(next);
    localStorage.setItem("fillbooks-timezone", next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="text-[15.5px] px-3 py-1.5 rounded-md bg-surface-2 border border-border text-text-secondary cursor-pointer"
    >
      {LABELS[tz]} ⌄
    </button>
  );
}
