"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppUserButton } from "./AppUserButton";

const NAV_TABS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Profile", href: "/dashboard/profile" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20" style={{ backgroundColor: "var(--tv-navy)" }}>
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="text-2xl shrink-0"
          style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-peach)" }}
        >
          TravelVerse
        </Link>

        {/* Nav tabs */}
        <nav className="flex items-center gap-1">
          {NAV_TABS.map((tab) => {
            const isActive =
              tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-white/60 hover:text-white"
                }`}
                style={{
                  fontFamily: "var(--font-fredoka)",
                  ...(isActive ? { backgroundColor: "var(--tv-terracotta)" } : {}),
                }}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* User button */}
        <AppUserButton />
      </div>
    </header>
  );
}
