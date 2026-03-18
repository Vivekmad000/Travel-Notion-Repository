'use client';

import { useState, useRef } from "react";
import { OutfitDeck } from "./OutfitDeck";
import { TripCalendar } from "./TripCalendar";

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
  const [title, setTitle] = useState(page.title);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(page.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(title);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 30);
  };

  const saveTitle = async () => {
    const trimmed = draft.trim() || title;
    setTitle(trimmed);
    setEditing(false);
    if (trimmed !== title) {
      await fetch(`/api/pages/${page.id}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
    }
  };

  return (
    <div className="min-h-screen px-8 py-10" style={{ backgroundColor: "var(--tv-cream)" }}>
      {/* Page Header */}
      <div className="max-w-5xl mx-auto mb-10">
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditing(false); }}
            className="text-5xl bg-transparent outline-none border-b-2 w-full"
            style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-navy)", borderColor: "var(--tv-terracotta)" }}
          />
        ) : (
          <h1
            className="text-5xl mb-1 cursor-pointer hover:opacity-70 transition-opacity group inline-flex items-center gap-3"
            style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-navy)" }}
            onClick={startEdit}
            title="Click to edit title"
          >
            {title}
            <span className="text-2xl opacity-0 group-hover:opacity-40 transition-opacity" style={{ color: "var(--tv-navy)" }}>✎</span>
          </h1>
        )}
        <p className="text-sm mt-2" style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}>
          Trip planner for <span className="font-semibold">{travelPlan.title}</span>
          {travelPlan.startDate && travelPlan.endDate && (
            <> &mdash; {new Date(travelPlan.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(travelPlan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
          )}
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Section 1: Outfit Deck */}
        <section>
          <SectionHeader
            number="01"
            title="Outfits"
            subtitle="Add outfits for this trip and swipe through them"
          />
          <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "white", border: "1px solid var(--tv-peach)" }}>
            <div className="p-6">
              <OutfitDeck pageId={page.id} />
            </div>
          </div>
        </section>

        {/* Section 2: Calendar */}
        <section>
          <SectionHeader
            number="02"
            title="Calendar"
            subtitle="Drag outfits to your trip days"
          />
          <div className="rounded-2xl p-6" style={{ backgroundColor: "white", border: "1px solid var(--tv-peach)" }}>
            <TripCalendar
              pageId={page.id}
              startDate={travelPlan.startDate}
              endDate={travelPlan.endDate}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--tv-terracotta)" }}>
        <span className="text-sm font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>{number}</span>
      </div>
      <div>
        <h2 className="text-2xl leading-tight" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>{title}</h2>
        <p className="text-sm" style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}>{subtitle}</p>
      </div>
    </div>
  );
}

