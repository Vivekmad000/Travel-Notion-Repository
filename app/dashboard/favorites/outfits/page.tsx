import { AppHeader } from "@/app/components/AppHeader";
import Image from "next/image";
import Link from "next/link";
import { OutfitsClient } from "./OutfitsClient";

export default function OutfitsPage() {
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--tv-cream)" }}>
      {/* Background bikini sketch */}
      <div
        className="fixed bottom-0 left-0 pointer-events-none select-none"
        style={{ zIndex: 0, opacity: 0.35, width: "25vw" }}
      >
        <Image
          src="/assets/bikini.png"
          alt=""
          width={564}
          height={705}
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      <AppHeader />

      <main className="relative max-w-5xl mx-auto px-6 py-10" style={{ zIndex: 10 }}>
        {/* Back link */}
        <Link
          href="/dashboard/favorites"
          className="inline-flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}
        >
          ← Back to Favorites
        </Link>

        {/* Heading */}
        <h1
          className="text-5xl mb-8"
          style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-navy)" }}
        >
          Outfits
        </h1>

        <OutfitsClient />
      </main>
    </div>
  );
}
