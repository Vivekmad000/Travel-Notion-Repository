import { AppHeader } from "@/app/components/AppHeader";
import Image from "next/image";
import Link from "next/link";

const CATEGORIES = [
  {
    slug: "packing-lists",
    label: "Packing Lists",
    description: "Essentials you always bring",
    icon: "/assets/pencil.png",
  },
  {
    slug: "outfits",
    label: "Outfits",
    description: "Looks saved for your trips",
    icon: "/assets/eyeglass.png",
  },
];

export default function FavoritesPage() {
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--tv-cream)" }}>
      {/* Background sketch */}
      <div
        className="fixed bottom-0 right-0 pointer-events-none select-none"
        style={{ zIndex: 0, opacity: 0.18, width: "30vw" }}
      >
        <Image
          src="/assets/beach_house.png"
          alt=""
          width={600}
          height={600}
          style={{ width: "100%", height: "auto" }}
        />
      </div>

      <AppHeader />

      <main className="relative max-w-4xl mx-auto px-6 py-10" style={{ zIndex: 10 }}>
        {/* Heading */}
        <h1
          className="text-5xl mb-2"
          style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-navy)" }}
        >
          Favorites
        </h1>
        <p
          className="mb-10 text-base"
          style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
        >
          Save things you love for your next adventure.
        </p>

        {/* Category grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/dashboard/favorites/${cat.slug}`}
              className="group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
              style={{ backgroundColor: "var(--tv-navy)" }}
            >
              {/* Top accent strip */}
              <div className="h-1.5" style={{ backgroundColor: "var(--tv-terracotta)" }} />

              <div className="p-6 flex items-center gap-5">
                {/* Icon */}
                <div
                  className="flex-shrink-0 rounded-xl p-3 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <Image
                    src={cat.icon}
                    alt={cat.label}
                    width={44}
                    height={44}
                    style={{ width: 44, height: 44, objectFit: "contain" }}
                  />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-xl font-semibold"
                    style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}
                  >
                    {cat.label}
                  </h2>
                  <p
                    className="text-sm mt-0.5"
                    style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-peach)" }}
                  >
                    {cat.description}
                  </p>
                </div>

                {/* Badge */}
                <span
                  className="flex-shrink-0 text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    fontFamily: "var(--font-fredoka)",
                    backgroundColor: "var(--tv-terracotta)",
                    color: "var(--tv-cream)",
                  }}
                >
                  0 items
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
