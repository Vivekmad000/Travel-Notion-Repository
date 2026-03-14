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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-xl font-bold text-indigo-600 shrink-0">
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
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
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
