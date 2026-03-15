const fs = require("fs");

const card = `'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShareModal } from "@/app/components/ShareModal";
import { formatMonthYear } from "@/lib/dateFormat";

type TravelPlan = {
  id: string;
  title: string;
  description: string | null;
  cities: string | null;
  startDate: string | null;
  endDate: string | null;
  _count: { pages: number };
};

type TravelPlanCardProps = {
  travelPlan: TravelPlan;
  onDelete: () => void;
};

function formatDate(dateStr: string | null) {
  return formatMonthYear(dateStr);
}

export function TravelPlanCard({ travelPlan, onDelete }: TravelPlanCardProps) {
  const router = useRouter();
  const [showShare, setShowShare] = useState(false);
  const cities = travelPlan.cities
    ? travelPlan.cities.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const startFormatted = formatDate(travelPlan.startDate);
  const endFormatted = formatDate(travelPlan.endDate);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(\`Delete "\${travelPlan.title}"? This cannot be undone.\`)) return;
    try {
      const res = await fetch(\`/api/travel-plans/\${travelPlan.id}\`, { method: "DELETE" });
      if (res.ok) onDelete();
    } catch {
      alert("Failed to delete travel plan");
    }
  };

  return (
    <div
      onClick={() => router.push(\`/dashboard/travels/\${travelPlan.id}\`)}
      className="rounded-xl cursor-pointer transition-all group overflow-hidden"
      style={{ backgroundColor: "white", border: "2px solid transparent", boxShadow: "0 1px 4px rgba(15,45,63,0.08)" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--tv-blue)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
    >
      {/* Colored top strip */}
      <div className="h-2 w-full" style={{ backgroundColor: "var(--tv-blue)" }} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold leading-tight flex-1 mr-2" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
            {travelPlan.title}
          </h3>
          <button
            onClick={handleDelete}
            className="transition-colors text-lg leading-none flex-shrink-0 opacity-0 group-hover:opacity-100"
            style={{ color: "#ccc" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
            aria-label="Delete"
            title="Delete travel plan"
          >
            ✕
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
            className="transition-colors text-sm leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 ml-1"
            style={{ color: "#ccc" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--tv-blue)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
            aria-label="Share"
            title="Share travel plan"
          >
            🔗
          </button>
        </div>

        {travelPlan.description && (
          <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--tv-blue)" }}>{travelPlan.description}</p>
        )}

        {(startFormatted || endFormatted) && (
          <div className="flex items-center gap-1 text-sm mb-3" style={{ color: "var(--tv-blue)" }}>
            <span>📅</span>
            <span>
              {startFormatted && endFormatted
                ? \`\${startFormatted} → \${endFormatted}\`
                : startFormatted || endFormatted}
            </span>
          </div>
        )}

        {cities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {cities.map((city) => (
              <span
                key={city}
                className="px-2 py-0.5 text-xs rounded-full font-medium"
                style={{ backgroundColor: "var(--tv-cream)", color: "var(--tv-terracotta)", border: "1px solid var(--tv-peach)" }}
              >
                {city}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid var(--tv-cream)" }}>
          <span className="text-xs" style={{ color: "var(--tv-blue)", opacity: 0.7 }}>
            {travelPlan._count.pages === 0
              ? "No pages yet"
              : \`\${travelPlan._count.pages} page\${travelPlan._count.pages === 1 ? "" : "s"}\`}
          </span>
          <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--tv-terracotta)", fontFamily: "var(--font-fredoka)" }}>
            Open →
          </span>
        </div>
      </div>

      {showShare && (
        <ShareModal
          resourceType="plan"
          resourceId={travelPlan.id}
          resourceTitle={travelPlan.title}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
`;

fs.writeFileSync("C:/Users/vivek/repos/travelnotion/app/dashboard/components/TravelPlanCard.tsx", card);
console.log("TravelPlanCard done");
