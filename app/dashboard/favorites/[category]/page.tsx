import { AppHeader } from "@/app/components/AppHeader";
import Image from "next/image";
import Link from "next/link";

const CATEGORY_META: Record<string, { label: string; description: string; icon: string }> = {
  "packing-lists": {
    label: "Packing Lists",
    description: "packing lists",
    icon: "/assets/pencil.png",
  },
  outfits: {
    label: "Outfits",
    description: "outfits",
    icon: "/assets/eyeglass.png",
  },
};

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const meta = CATEGORY_META[category];

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: "var(--tv-cream)" }}>
      {/* Background decoration — outfits: full-width clothesline; others: vacay_seats */}
      {category === "outfits" ? (
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
      ) : (
        <div
          className="fixed bottom-0 left-0 pointer-events-none select-none"
          style={{ zIndex: 0, opacity: 0.15, width: "22vw" }}
        >
          <Image
            src="/assets/vacay_seats.png"
            alt=""
            width={400}
            height={400}
            style={{ width: "100%", height: "auto" }}
          />
        </div>
      )}

      <AppHeader />

      <main className="relative max-w-3xl mx-auto px-6 py-10" style={{ zIndex: 10 }}>
        {/* Back link */}
        <Link
          href="/dashboard/favorites"
          className="inline-flex items-center gap-1.5 text-sm mb-8 hover:opacity-70 transition-opacity"
          style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}
        >
          ← Back to Favorites
        </Link>

        {/* Page heading */}
        {meta ? (
          <>
            <div className="flex items-center gap-4 mb-10">
              <div
                className="rounded-xl p-3 flex items-center justify-center"
                style={{ backgroundColor: "var(--tv-navy)" }}
              >
                <Image
                  src={meta.icon}
                  alt={meta.label}
                  width={40}
                  height={40}
                  style={{ width: 40, height: 40, objectFit: "contain" }}
                />
              </div>
              <h1
                className="text-5xl"
                style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-navy)" }}
              >
                {meta.label}
              </h1>
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Image
                src="/assets/plane.png"
                alt=""
                width={80}
                height={80}
                style={{ width: 80, height: 80, objectFit: "contain", opacity: 0.6 }}
              />
              <h2
                className="mt-6 text-2xl"
                style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}
              >
                Nothing here yet!
              </h2>
              <p
                className="mt-2 text-sm max-w-xs"
                style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
              >
                Start adding your favourite {meta.description} to see them here.
              </p>
            </div>
          </>
        ) : (
          /* Unknown category fallback */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <h1
              className="text-3xl"
              style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}
            >
              Category not found
            </h1>
            <Link
              href="/dashboard/favorites"
              className="mt-4 text-sm underline"
              style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
            >
              Go back to Favorites
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
