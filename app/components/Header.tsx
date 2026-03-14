'use client';

import { SignUpButton, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export function Header() {
  const { user } = useUser();

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-indigo-600">
          TravelNotion
        </Link>
        <nav className="flex gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-gray-700 hover:text-indigo-600 font-medium">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
