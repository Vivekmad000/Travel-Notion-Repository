"use client";

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
    if (!confirm(`Remove "${item.title}" from your shared plans?`)) return;
    try {
      await fetch(`/api/share/access/${item.shareLinkId}`, { method: "DELETE" });
      onRemove(item.shareLinkId);
    } catch {
      alert("Failed to remove");
    }
  };

  return (
    <div
      onClick={() => router.push(`/shared/${item.token}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group relative"
    >
      {/* Shared badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
          {item.permission === "edit" ? "✏️ edit" : "👁 view"}
        </span>
      </div>

      <div className="flex items-start justify-between mb-3 pr-16">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
          {item.title}
        </h3>
        <button
          onClick={handleRemove}
          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 ml-2"
          aria-label="Remove from shared"
          title="Remove from your shared plans"
        >
          ✕
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3">Shared by {item.ownerName}</p>

      {item.description && (
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{item.description}</p>
      )}

      {(item.startDate || item.endDate) && (
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <span>📅</span>
          <span>
            {[formatDate(item.startDate), formatDate(item.endDate)].filter(Boolean).join(" → ")}
          </span>
        </div>
      )}

      {cities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {cities.map((city) => (
            <span key={city} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
              {city}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {item._count.pages === 0 ? "No pages" : `${item._count.pages} page${item._count.pages === 1 ? "" : "s"}`}
        </span>
        <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Open →
        </span>
      </div>
    </div>
  );
}
