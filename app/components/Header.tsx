'use client';

import { SignUpButton, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-20 relative" style={{ backgroundColor: "var(--tv-navy)" }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl shrink-0" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}>
          Planora
        </Link>

        {/* Centered nav links */}
        {mounted && user && (
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1">
            <Link href="/dashboard" className="text-sm font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-80" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
              Dashboard
            </Link>
            <Link href="/dashboard/profile" className="text-sm font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-80" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
              Profile
            </Link>
            <Link href="/dashboard/favorites" className="text-sm font-semibold px-4 py-1.5 rounded-full transition-opacity hover:opacity-80" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
              Favorites
            </Link>
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          {mounted && user ? (
            <UserButton />
          ) : mounted ? (
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
          ) : null}
        </div>
      </div>
    </header>
  );
}
