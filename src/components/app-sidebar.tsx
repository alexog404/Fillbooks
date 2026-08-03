"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "▦" },
  { href: "/trades", label: "Trades", icon: "☰" },
  { href: "/journal", label: "Daily Journal", icon: "✎" },
  { href: "/reports", label: "Reports", icon: "▤" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-[216px] shrink-0 flex flex-col bg-surface border-r border-border sticky top-0 h-screen">
      <div className="flex items-center gap-[9px] px-[18px] pt-5 pb-4">
        <div className="w-[26px] h-[26px] rounded-md bg-primary flex items-center justify-center font-extrabold text-[13px] text-white">
          F
        </div>
        <div className="font-bold text-[15px] tracking-[0.3px]">FILLBOOKS</div>
      </div>

      <div className="px-3 flex flex-col gap-0.5 mt-1.5">
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] font-medium hover:bg-surface-hover"
              style={active ? { background: "var(--accent-soft)", color: "var(--primary)" } : undefined}
            >
              <div className="w-4 h-4 shrink-0 opacity-90">{item.icon}</div>
              <div>{item.label}</div>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-border">
        <div className="text-[11px] text-text-muted mb-2">Theme</div>
        <ThemeToggle />
        <div className="text-[10.5px] text-text-muted mt-2.5">
          Personal Equities Day-Trading Journal
        </div>
      </div>
    </div>
  );
}
