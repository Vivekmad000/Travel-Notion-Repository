const fs = require("fs");

// ── Header.tsx ──
const header = `'use client';

import { SignUpButton, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function Header() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-20" style={{ backgroundColor: "var(--tv-navy)" }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl shrink-0" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}>
          Planora
        </Link>
        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-80" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-80" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="text-sm font-semibold px-5 py-2 rounded-full transition-opacity hover:opacity-90" style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}>
                  Get Started
                </button>
              </SignUpButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
`;
fs.writeFileSync("C:/Users/vivek/repos/travelnotion/app/components/Header.tsx", header);
console.log("Header.tsx done");
