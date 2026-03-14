import { SignUpButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Header } from "./components/Header";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Plan Your Adventures
        </h2>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Organize your travel notes, collaborate with friends in real-time, and
          keep all your trip memories in one beautiful, Notion-like workspace.
        </p>

        <div className="flex gap-4 justify-center">
          <SignUpButton mode="modal">
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 font-medium text-lg">
              Get Started Free
            </button>
          </SignUpButton>
          <SignInButton mode="modal">
            <button className="border-2 border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 font-medium text-lg">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Rich Notes
            </h3>
            <p className="text-gray-600">
              Create beautiful notes with text, images, embeds, and code blocks.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Real-time Collab
            </h3>
            <p className="text-gray-600">
              Edit notes together with friends and see changes instantly.
            </p>
          </div>
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Travel Stats
            </h3>
            <p className="text-gray-600">
              Track countries visited, trips completed, and travel memories.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
