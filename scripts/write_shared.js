const fs = require("fs");

const shared = `"use client";

import { useRouter } from "next/navigation";
import { formatMonthYear } from "@/lib/dateFormat";

type SharedItem = {
  shareLinkId: string;
  token: string;
  permission: "view" | "edit";
  ownerName: string;
  title: string;
  description: string | null;
  cities: string | null;
  startDate: string | null;
  endDate: string | null;
  _count: { pages: number };
};

type Props = {
  item: SharedItem;
  onRemove: (shareLinkId: string) => void;
};

function formatDate(dateStr: string | null) {
  return formatMonthYear(dateStr);
}

export function SharedPlanCard({ item, onRemove }: Props) {
  const router = useRouter();
  const cities = item.cities
    ? item.cities.split(",").map((c) => c.trim()).filter(Boolean)
    : [];

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(\`Remove "\${item.title}" from your shared plans?\`)) return;
    try {
      await fetch(\`/api/share/access/\${item.shareLinkId}\`, { method: "DELETE" });
      onRemove(item.shareLinkId);
    } catch {
      alert("Failed to remove");
    }
  };

  return (
    <div
      onClick={() => router.push(\`/shared/\${item.token}\`)}
      className="rounded-xl cursor-pointer transition-all group overflow-hidden relative"
      style={{ backgroundColor: "white", border: "2px solid transparent", boxShadow: "0 1px 4px rgba(15,45,63,0.08)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--tv-terracotta)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
    >
      {/* Terracotta top strip for shared cards */}
      <div className="h-2 w-full" style={{ backgroundColor: "var(--tv-terracotta)" }} />

      <div className="p-5">
        {/* Permission badge */}
        <div className="absolute top-5 right-5">
          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "var(--tv-cream)", color: "var(--tv-terracotta)", border: "1px solid var(--tv-peach)" }}>
            {item.permission === "edit" ? "✏️ edit" : "👁 view"}
          </span>
        </div>

        <div className="flex items-start justify-between mb-1 pr-16">
          <h3 className="text-lg font-semibold leading-tight" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
            {item.title}
          </h3>
          <button
            onClick={handleRemove}
            className="text-lg leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 ml-2 transition-colors"
            style={{ color: "#ccc" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
            aria-label="Remove from shared"
          >
            ✕
          </button>
        </div>

        <p className="text-xs mb-3" style={{ color: "var(--tv-blue)", opacity: 0.8 }}>Shared by {item.ownerName}</p>

        {item.description && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--tv-blue)" }}>{item.description}</p>
        )}

        {(item.startDate || item.endDate) && (
          <div className="flex items-center gap-1 text-sm mb-3" style={{ color: "var(--tv-blue)" }}>
            <span>📅</span>
            <span>{[formatDate(item.startDate), formatDate(item.endDate)].filter(Boolean).join(" → ")}</span>
          </div>
        )}

        {cities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {cities.map((city) => (
              <span key={city} className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: "var(--tv-cream)", color: "var(--tv-terracotta)", border: "1px solid var(--tv-peach)" }}>
                {city}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid var(--tv-cream)" }}>
          <span className="text-xs" style={{ color: "var(--tv-blue)", opacity: 0.7 }}>
            {item._count.pages === 0 ? "No pages" : \`\${item._count.pages} page\${item._count.pages === 1 ? "" : "s"}\`}
          </span>
          <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--tv-terracotta)", fontFamily: "var(--font-fredoka)" }}>
            Open →
          </span>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync("C:/Users/vivek/repos/travelnotion/app/dashboard/components/SharedPlanCard.tsx", shared);
console.log("SharedPlanCard done");
