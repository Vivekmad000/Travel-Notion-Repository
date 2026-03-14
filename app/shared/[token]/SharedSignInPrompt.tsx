"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function SharedSignInPrompt({ token }: { token: string }) {
  const redirectUrl = `/shared/${token}`;
  return (
    <div className="flex flex-col gap-2">
      <SignInButton mode="modal" forceRedirectUrl={redirectUrl}>
        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal" forceRedirectUrl={redirectUrl}>
        <button className="w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-lg transition-colors">
          Create an account
        </button>
      </SignUpButton>
    </div>
  );
}
