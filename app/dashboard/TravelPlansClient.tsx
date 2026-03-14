'use client';

import { useState } from "react";
import Link from "next/link";
import { TravelPlanCard } from "./components/TravelPlanCard";
import { SharedPlanCard } from "./components/SharedPlanCard";
import { CreateTravelPlanModal } from "./components/CreateTravelPlanModal";
import { getContinents, sortContinents } from "@/lib/continents";
import { formatMonthYear } from "@/lib/dateFormat";

type TravelPlan = {
  id: string;
  title: string;
  description: string | null;
  cities: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { pages: number };
};

type SharedItem = {
  shareLinkId: string;
  token: string;
  resourceType: "plan";
  permission: "view" | "edit";
  ownerName: string;
  id: string;
  title: string;
  description: string | null;
  cities: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  _count: { pages: number };
};

type ViewMode = "recent" | "continent" | "year";

type TravelPlansClientProps = {
  initialTravelPlans: TravelPlan[];
  sharedWithMe: SharedItem[];
};

function formatMonth(dateStr: string | null) {
  return formatMonthYear(dateStr);
}

function groupPlans(plans: TravelPlan[], mode: ViewMode): { label: string; plans: TravelPlan[] }[] {
  if (mode === "recent") {
    const sorted = [...plans].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return [{ label: "Recent", plans: sorted }];
  }

  if (mode === "year") {
    const buckets = new Map<string, TravelPlan[]>();
    for (const plan of plans) {
      const year = plan.startDate ? new Date(plan.startDate).getFullYear().toString() : "No Date";
      if (!buckets.has(year)) buckets.set(year, []);
      buckets.get(year)!.push(plan);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => {
        if (a === "No Date") return 1;
        if (b === "No Date") return -1;
        return Number(b) - Number(a);
      })
      .map(([label, plans]) => ({ label, plans }));
  }

  if (mode === "continent") {
    const buckets = new Map<string, TravelPlan[]>();
    for (const plan of plans) {
      const continents = getContinents(plan.cities);
      for (const continent of continents) {
        if (!buckets.has(continent)) buckets.set(continent, []);
        buckets.get(continent)!.push(plan);
      }
    }
    const sorted = sortContinents([...buckets.keys()]);
    const finalKeys = [...sorted.filter((k) => k !== "Unknown"), ...sorted.filter((k) => k === "Unknown")];
    return finalKeys.map((label) => ({ label, plans: buckets.get(label)! }));
  }

  return [];
}

export function TravelPlansClient({ initialTravelPlans, sharedWithMe: initialShared }: TravelPlansClientProps) {
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>(initialTravelPlans);
  const [sharedPlans, setSharedPlans] = useState<SharedItem[]>(initialShared);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("recent");

  const handlePlanCreated = (plan: TravelPlan) => setTravelPlans((prev) => [plan, ...prev]);
  const handlePlanDeleted = (id: string) => setTravelPlans((prev) => prev.filter((p) => p.id !== id));
  const handleSharedRemoved = (shareLinkId: string) =>
    setSharedPlans((prev) => prev.filter((s) => s.shareLinkId !== shareLinkId));

  const groups = groupPlans(travelPlans, viewMode);

  const recentPlans = [...travelPlans].sort((a, b) => {
    if (!a.startDate && !b.startDate) return 0;
    if (!a.startDate) return 1;
    if (!b.startDate) return -1;
    return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
  });

  const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
    { value: "recent", label: "Recent" },
    { value: "continent", label: "Continent" },
    { value: "year", label: "Year" },
  ];

  return (
    <div className="flex gap-8 items-start">

      {/* Left Sidebar */}
      <aside className="w-56 flex-shrink-0 sticky top-24">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent</span>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors text-sm"
              title="New travel plan"
            >
              +
            </button>
          </div>
          {recentPlans.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6 px-4">No plans yet</p>
          ) : (
            <ul className="py-1">
              {recentPlans.map((plan) => (
                <li key={plan.id}>
                  <Link
                    href={`/dashboard/travels/${plan.id}`}
                    className="flex flex-col px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-800 font-medium truncate group-hover:text-indigo-600 transition-colors">
                      {plan.title}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      {formatMonth(plan.startDate) ?? new Date(plan.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Shared with me — sidebar list */}
        {sharedPlans.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-3">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Shared</span>
            </div>
            <ul className="py-1">
              {sharedPlans.map((item) => (
                <li key={item.token}>
                  <Link
                    href={`/shared/${item.token}`}
                    className="flex flex-col px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                  >
                    <span className="text-sm text-gray-800 font-medium truncate group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      by {item.ownerName} · {item.permission === "edit" ? "✏️ edit" : "👁 view"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your travel plans</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            New Travel Plan
          </button>
        </div>

        {/* View mode selector — only shown when there are plans */}
        {travelPlans.length > 0 && (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-8">
            {VIEW_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === opt.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {travelPlans.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-16 text-center">
            <div className="text-6xl mb-4">🌍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No travel plans yet</h2>
            <p className="text-gray-500 mb-6">Create your first travel plan to get started!</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
            >
              Create your first travel plan
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {groups.map((group) => (
              <section key={group.label}>
                {/* Section header bar */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">{group.plans.length}</span>
                </div>
                {/* Cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.plans.map((plan) => (
                    <TravelPlanCard
                      key={`${group.label}-${plan.id}`}
                      travelPlan={plan}
                      onDelete={() => handlePlanDeleted(plan.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Shared with me — main grid */}
        {sharedPlans.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Shared with me</span>
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">{sharedPlans.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedPlans.map((item) => (
                <SharedPlanCard
                  key={item.shareLinkId}
                  item={item}
                  onRemove={handleSharedRemoved}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateTravelPlanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePlanCreated}
      />
    </div>
  );
}
