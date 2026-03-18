'use client';

import { useEffect, useState, useCallback } from "react";
import { DndContext, useDroppable, useDraggable, type DragEndEvent, PointerSensor, useSensors, useSensor } from "@dnd-kit/core";

// ─── Types ────────────────────────────────────────────────────────────────────

type OutfitItem = { id: string; clothingItemId: string; x: number; y: number; zIndex: number; clothingItem: { id: string; imageUrl: string } };
type Outfit = { id: string; name: string; items: OutfitItem[] };
type PlannerOutfit = { id: string; outfitId: string; outfit: Outfit };

type CalendarEntry = {
  id: string;
  date: string;
  order: number;
  plannerOutfit: PlannerOutfit;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay(); // 0=Sun
}

/** Returns an array of {year, month} pairs covering the range start→end (inclusive) */
function monthsInRange(start: Date, end: Date): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  const endY = end.getFullYear();
  const endM = end.getMonth();
  while (y < endY || (y === endY && m <= endM)) {
    months.push({ year: y, month: m });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return months;
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─── Draggable Outfit Chip (in the sidebar list) ───────────────────────────

function DraggablePlannerOutfit({ po }: { po: PlannerOutfit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `planner-${po.id}`,
    data: { plannerOutfitId: po.id },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="rounded-xl overflow-hidden cursor-grab select-none"
      style={{
        backgroundColor: "var(--tv-navy)",
        opacity: isDragging ? 0.5 : 1,
        width: 90,
        flexShrink: 0,
      }}
    >
      <div style={{ height: 3, backgroundColor: "var(--tv-terracotta)" }} />
      {/* Mini canvas */}
      <div className="relative overflow-hidden" style={{ height: 80, backgroundColor: "white" }}>
        {po.outfit.items.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ color: "#ccc", fontSize: 10 }}>Empty</span>
          </div>
        ) : (
          po.outfit.items.map((item) => (
            <img
              key={item.id}
              src={item.clothingItem.imageUrl}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: "translate(-50%,-50%)",
                width: 36,
                height: 36,
                objectFit: "contain",
                zIndex: item.zIndex,
                pointerEvents: "none",
              }}
            />
          ))
        )}
      </div>
      <div className="px-1 py-1 text-center">
        <span style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)", fontSize: 10 }}
          className="block truncate"
        >
          {po.outfit.name}
        </span>
      </div>
    </div>
  );
}

// ─── Day Cell Drop Zone ────────────────────────────────────────────────────

function DayCell({
  date,
  isTrip,
  entries,
  onRemoveEntry,
}: {
  date: string;
  isTrip: boolean;
  entries: CalendarEntry[];
  onRemoveEntry: (entryId: string) => void;
}) {
  const dayNum = parseInt(date.split("-")[2], 10);
  const { setNodeRef, isOver } = useDroppable({ id: `day-${date}`, disabled: !isTrip });

  return (
    <div
      ref={setNodeRef}
      className="rounded-lg min-h-[80px] p-1 flex flex-col gap-1 transition-colors"
      style={{
        backgroundColor: !isTrip
          ? "rgba(0,0,0,0.04)"
          : isOver
          ? "rgba(53,82,172,0.12)"
          : "white",
        border: isOver ? "1.5px solid var(--tv-blue)" : "1.5px solid transparent",
      }}
    >
      <span
        className="text-xs font-semibold self-end"
        style={{
          color: isTrip ? "var(--tv-navy)" : "#bbb",
          fontFamily: "var(--font-fredoka)",
        }}
      >
        {dayNum}
      </span>

      {/* Outfit chips */}
      {isTrip && entries.map((entry) => (
        <div
          key={entry.id}
          className="relative rounded overflow-hidden"
          style={{ backgroundColor: "var(--tv-navy)" }}
        >
          <div style={{ height: 2, backgroundColor: "var(--tv-terracotta)" }} />
          <div className="relative overflow-hidden" style={{ height: 36 }}>
            {entry.plannerOutfit.outfit.items.map((item) => (
              <img
                key={item.id}
                src={item.clothingItem.imageUrl}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: "translate(-50%,-50%)",
                  width: 24,
                  height: 24,
                  objectFit: "contain",
                  zIndex: item.zIndex,
                  pointerEvents: "none",
                }}
              />
            ))}
          </div>
          <button
            onClick={() => onRemoveEntry(entry.id)}
            className="absolute top-0.5 right-0.5 z-10 w-4 h-4 rounded-full flex items-center justify-center text-xs leading-none"
            style={{ backgroundColor: "var(--tv-terracotta)", color: "white", fontSize: 9, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Month Grid ───────────────────────────────────────────────────────────

function MonthGrid({
  year,
  month,
  tripStart,
  tripEnd,
  entries,
  onRemoveEntry,
}: {
  year: number;
  month: number;
  tripStart: Date;
  tripEnd: Date;
  entries: CalendarEntry[];
  onRemoveEntry: (entryId: string) => void;
}) {
  const days = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);
  const entriesByDate = new Map<string, CalendarEntry[]>();
  for (const e of entries) {
    if (!entriesByDate.has(e.date)) entriesByDate.set(e.date, []);
    entriesByDate.get(e.date)!.push(e);
  }

  // Build grid cells: leading blanks + day cells
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];

  return (
    <div>
      <h3
        className="text-xl mb-3"
        style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}
      >
        {MONTH_NAMES[month]} {year}
      </h3>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_NAMES.map((d) => (
          <div key={d} className="text-center text-xs font-semibold"
            style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`blank-${i}`} />;
          }
          const date = isoDate(year, month, day);
          const cellDate = new Date(year, month, day);
          const isTrip = cellDate >= tripStart && cellDate <= tripEnd;
          return (
            <DayCell
              key={date}
              date={date}
              isTrip={isTrip}
              entries={entriesByDate.get(date) ?? []}
              onRemoveEntry={onRemoveEntry}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

type TripCalendarProps = {
  pageId: string;
  startDate: string | null;
  endDate: string | null;
};

export function TripCalendar({ pageId, startDate, endDate }: TripCalendarProps) {
  const [plannerOutfits, setPlannerOutfits] = useState<PlannerOutfit[]>([]);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    Promise.all([
      fetch(`/api/planner/${pageId}/outfits`).then((r) => r.json()),
      fetch(`/api/planner/${pageId}/calendar`).then((r) => r.json()),
    ]).then(([outfitData, calData]) => {
      setPlannerOutfits(outfitData.plannerOutfits ?? []);
      setEntries(calData.entries ?? []);
      setLoading(false);
    });
  }, [pageId]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { over, active } = event;
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("day-")) return;

    const date = overId.replace("day-", "");
    const plannerOutfitId = (active.data?.current as { plannerOutfitId?: string })?.plannerOutfitId;
    if (!plannerOutfitId) return;

    const res = await fetch(`/api/planner/${pageId}/calendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plannerOutfitId, date }),
    });
    const json = await res.json();
    if (json.entry) {
      setEntries((prev) => [...prev, json.entry as CalendarEntry]);
    }
  }, [pageId]);

  const handleRemoveEntry = useCallback(async (entryId: string) => {
    await fetch(`/api/planner/${pageId}/calendar/${entryId}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  }, [pageId]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!startDate || !endDate) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ backgroundColor: "white", border: "1.5px dashed var(--tv-peach)" }}
      >
        <p style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", fontSize: 18 }}>
          No trip dates set
        </p>
        <p style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", fontSize: 14, marginTop: 4 }}>
          Edit your travel plan to add start &amp; end dates.
        </p>
      </div>
    );
  }

  const tripStart = new Date(startDate);
  const tripEnd = new Date(endDate);
  // Normalize to midnight local time to avoid timezone offset issues
  tripStart.setHours(0, 0, 0, 0);
  tripEnd.setHours(0, 0, 0, 0);
  const months = monthsInRange(tripStart, tripEnd);

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-6">
        {/* Outfit drag strip */}
        {plannerOutfits.length > 0 && (
          <div className="shrink-0 w-24">
            <p style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)", fontSize: 11, marginBottom: 8 }}
              className="uppercase tracking-widest">
              Drag
            </p>
            <div className="flex flex-col gap-3">
              {plannerOutfits.map((po) => (
                <DraggablePlannerOutfit key={po.id} po={po} />
              ))}
            </div>
          </div>
        )}

        {/* Calendar months */}
        <div className="flex-1 space-y-8">
          {months.map(({ year, month }) => (
            <MonthGrid
              key={`${year}-${month}`}
              year={year}
              month={month}
              tripStart={tripStart}
              tripEnd={tripEnd}
              entries={entries.filter((e) => {
                const [y, m] = e.date.split("-").map(Number);
                return y === year && m - 1 === month;
              })}
              onRemoveEntry={handleRemoveEntry}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
