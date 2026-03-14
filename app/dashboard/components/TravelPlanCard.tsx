'use client';

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
    if (!confirm(`Delete "${travelPlan.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/travel-plans/${travelPlan.id}`, { method: "DELETE" });
      if (res.ok) onDelete();
    } catch {
      alert("Failed to delete travel plan");
    }
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/travels/${travelPlan.id}`)}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight flex-1 mr-2">
          {travelPlan.title}
        </h3>
        <button
          onClick={handleDelete}
          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0 opacity-0 group-hover:opacity-100"
          aria-label="Delete"
          title="Delete travel plan"
        >
          ✕
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setShowShare(true); }}
          className="text-gray-300 hover:text-indigo-500 transition-colors text-sm leading-none flex-shrink-0 opacity-0 group-hover:opacity-100 ml-1"
          aria-label="Share"
          title="Share travel plan"
        >
          🔗
        </button>
      </div>

      {travelPlan.description && (
        <p className="text-gray-500 text-sm mb-3 line-clamp-2">{travelPlan.description}</p>
      )}

      {(startFormatted || endFormatted) && (
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <span>📅</span>
          <span>
            {startFormatted && endFormatted
              ? `${startFormatted} → ${endFormatted}`
              : startFormatted || endFormatted}
          </span>
        </div>
      )}

      {cities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {cities.map((city) => (
            <span
              key={city}
              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium"
            >
              {city}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          {travelPlan._count.pages === 0
            ? "No pages yet"
            : `${travelPlan._count.pages} page${travelPlan._count.pages === 1 ? "" : "s"}`}
        </span>
        <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Open →
        </span>
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
