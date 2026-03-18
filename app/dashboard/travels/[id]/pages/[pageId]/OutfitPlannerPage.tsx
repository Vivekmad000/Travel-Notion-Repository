'use client';

import { PlannerOutfitsSection } from "./PlannerOutfitsSection";

type TravelPlan = {
  id: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
};

type Page = {
  id: string;
  title: string;
  travelPlanId: string;
};

type OutfitPlannerPageProps = {
  page: Page;
  travelPlan: TravelPlan;
  userName: string;
};

export function OutfitPlannerPage({ page, travelPlan, userName }: OutfitPlannerPageProps) {
  return (
    <div
      className="min-h-screen px-8 py-10"
      style={{ backgroundColor: "var(--tv-cream)" }}
    >
      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <h1
          className="text-5xl mb-2"
          style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-navy)" }}
        >
          {page.title}
        </h1>
        <p
          className="text-sm"
          style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
        >
          Trip planner for <span className="font-semibold">{travelPlan.title}</span>
          {travelPlan.startDate && travelPlan.endDate && (
            <> &mdash; {new Date(travelPlan.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(travelPlan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
          )}
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Section 1: Outfits */}
        <section>
          <SectionHeader
            number="01"
            title="Outfits"
            subtitle="Add outfits to pack for this trip"
          />
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid var(--tv-peach)" }}>
            <div className="p-6">
              <PlannerOutfitsSection pageId={page.id} />
            </div>
          </div>
        </section>

        {/* Section 2: Closet Carousel */}
        <section>
          <SectionHeader
            number="02"
            title="Closet Carousel"
            subtitle="Swipe through your trip outfits"
          />
          <div
            className="rounded-2xl p-6 flex items-center justify-center"
            style={{ backgroundColor: "white", border: "1.5px dashed var(--tv-peach)", minHeight: 160 }}
          >
            <p style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", opacity: 0.6 }}>
              Swipe carousel coming soon…
            </p>
          </div>
        </section>

        {/* Section 3: Calendar */}
        <section>
          <SectionHeader
            number="03"
            title="Calendar"
            subtitle="Drag outfits to your trip days"
          />
          <div
            className="rounded-2xl p-6 flex items-center justify-center"
            style={{ backgroundColor: "white", border: "1.5px dashed var(--tv-peach)", minHeight: 160 }}
          >
            <p style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", opacity: 0.6 }}>
              Calendar coming soon…
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "var(--tv-terracotta)" }}
      >
        <span
          className="text-sm font-bold"
          style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}
        >
          {number}
        </span>
      </div>
      <div>
        <h2
          className="text-2xl leading-tight"
          style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}
        >
          {title}
        </h2>
        <p
          className="text-sm"
          style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}
