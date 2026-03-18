'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { OutfitEditorModal, type ClothingItem, type Outfit } from "@/app/components/OutfitEditorModal";
import { ImportOutfitModal } from "./ImportOutfitModal";

// ─── Types ────────────────────────────────────────────────────────────────────

type PlannerOutfit = { id: string; outfitId: string; outfit: Outfit };

// ─── Mini collage preview (reused in card and drag strip) ─────────────────────

function OutfitMiniCanvas({ items }: { items: Outfit["items"] }) {
  return (
    <div className="relative w-full h-full overflow-hidden" style={{ backgroundColor: "white" }}>
      {items.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          <span style={{ color: "#ccc", fontSize: 12, fontFamily: "var(--font-nunito)" }}>Empty</span>
        </div>
      ) : (
        items.map((item) => (
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
              width: 52,
              height: 52,
              objectFit: "contain",
              zIndex: item.zIndex,
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ))
      )}
    </div>
  );
}

// ─── OutfitDeck ───────────────────────────────────────────────────────────────

export function OutfitDeck({ pageId }: { pageId: string }) {
  const [plannerOutfits, setPlannerOutfits] = useState<PlannerOutfit[]>([]);
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [editorOutfit, setEditorOutfit] = useState<Outfit | null>(null);

  // Drag state for browse swiping
  const drag = useRef({ isDragging: false, startX: 0, currentDelta: 0 });
  const busy = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const plannerOutfitsRef = useRef<PlannerOutfit[]>([]);
  const currentIndexRef = useRef(0);
  plannerOutfitsRef.current = plannerOutfits;
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    Promise.all([
      fetch(`/api/planner/${pageId}/outfits`).then((r) => r.json()),
      fetch("/api/clothing").then((r) => r.json()),
    ]).then(([plannerData, clothingData]) => {
      setPlannerOutfits(plannerData.plannerOutfits ?? []);
      setClosetItems(clothingData.items ?? clothingData ?? []);
      setLoading(false);
    });
  }, [pageId]);

  // ── Navigation ──────────────────────────────────────────────────────────────

  const goNext = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.3s ease";
      cardRef.current.style.transform = "translateX(-380px)";
    }
    setTimeout(() => {
      busy.current = false;
      drag.current.currentDelta = 0;
      setCurrentIndex((i) => Math.min(i + 1, plannerOutfitsRef.current.length - 1));
      if (cardRef.current) {
        cardRef.current.style.transition = "none";
        cardRef.current.style.transform = "";
      }
    }, 300);
  }, []);

  const goPrev = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.3s ease";
      cardRef.current.style.transform = "translateX(380px)";
    }
    setTimeout(() => {
      busy.current = false;
      drag.current.currentDelta = 0;
      setCurrentIndex((i) => Math.max(i - 1, 0));
      if (cardRef.current) {
        cardRef.current.style.transition = "none";
        cardRef.current.style.transform = "";
      }
    }, 300);
  }, []);

  // ── Drag handlers ────────────────────────────────────────────────────────────

  useEffect(() => {
    function onMove(clientX: number) {
      if (!drag.current.isDragging || !cardRef.current) return;
      const delta = clientX - drag.current.startX;
      drag.current.currentDelta = delta;
      cardRef.current.style.transform = `translateX(${delta}px) rotate(${delta * 0.03}deg)`;
    }

    function onRelease() {
      if (!drag.current.isDragging) return;
      drag.current.isDragging = false;
      const delta = drag.current.currentDelta;
      if (delta < -80 && currentIndexRef.current < plannerOutfitsRef.current.length - 1) {
        goNext();
      } else if (delta > 80 && currentIndexRef.current > 0) {
        goPrev();
      } else {
        if (cardRef.current) {
          cardRef.current.style.transition = "transform 0.3s ease";
          cardRef.current.style.transform = "";
        }
        drag.current.currentDelta = 0;
      }
    }

    const onMouseMove = (e: MouseEvent) => onMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => onMove(e.touches[0].clientX);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onRelease);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onRelease);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onRelease);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onRelease);
    };
  }, [goNext, goPrev]);

  function handleCardMouseDown(e: React.MouseEvent) {
    if (busy.current) return;
    e.preventDefault();
    drag.current = { isDragging: true, startX: e.clientX, currentDelta: 0 };
    if (cardRef.current) cardRef.current.style.transition = "none";
  }

  function handleCardTouchStart(e: React.TouchEvent) {
    if (busy.current) return;
    drag.current = { isDragging: true, startX: e.touches[0].clientX, currentDelta: 0 };
    if (cardRef.current) cardRef.current.style.transition = "none";
  }

  // ── Add / Import / Delete ────────────────────────────────────────────────────

  async function handleImport(outfitIds: string[]) {
    const results = await Promise.all(
      outfitIds.map((outfitId) =>
        fetch(`/api/planner/${pageId}/outfits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ outfitId }),
        }).then((r) => r.json())
      )
    );
    const added = results.filter((r) => r.plannerOutfit).map((r) => r.plannerOutfit as PlannerOutfit);
    setPlannerOutfits((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const fresh = added.filter((a) => !ids.has(a.id));
      return [
        ...fresh, // new outfits go to front of list
        ...prev,
      ];
    });
    setCurrentIndex(0);
  }

  async function handleCreateNew() {
    const outfitRes = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Outfit", plannerOnly: true }),
    });
    const newOutfit = await outfitRes.json();
    const plannerRes = await fetch(`/api/planner/${pageId}/outfits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId: newOutfit.id }),
    });
    const plannerJson = await plannerRes.json();
    if (plannerJson.plannerOutfit) {
      setPlannerOutfits((prev) => [plannerJson.plannerOutfit, ...prev]);
      setCurrentIndex(0);
      setEditorOutfit(plannerJson.plannerOutfit.outfit);
    }
  }

  async function handleDeleteCurrent() {
    const po = plannerOutfits[currentIndex];
    if (!po) return;
    if (!confirm(`Remove "${po.outfit.name}" from this trip?`)) return;
    await fetch(`/api/planner/${pageId}/outfits/${po.id}`, { method: "DELETE" });
    setPlannerOutfits((prev) => prev.filter((p) => p.id !== po.id));
    setCurrentIndex((i) => Math.max(0, Math.min(i, plannerOutfits.length - 2)));
  }

  function handleEditorUpdate(updated: Outfit) {
    setPlannerOutfits((prev) =>
      prev.map((po) => po.outfitId === updated.id ? { ...po, outfit: updated } : po)
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const alreadyAddedIds = plannerOutfits.map((po) => po.outfitId);
  const hasPlannerOutfits = plannerOutfits.length > 0;
  const currentOutfit = plannerOutfits[currentIndex];

  return (
    <>
      {/* Modals */}
      <ImportOutfitModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        alreadyAddedIds={alreadyAddedIds}
      />
      {editorOutfit && (
        <OutfitEditorModal
          outfit={editorOutfit}
          closetItems={closetItems}
          onClose={() => setEditorOutfit(null)}
          onUpdate={handleEditorUpdate}
        />
      )}

      <div className="flex flex-col items-center gap-6">
        {/* Action buttons */}
        <div className="flex gap-3 self-end">
          <button
            onClick={() => setImportOpen(true)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2 hover:opacity-80 transition-opacity"
            style={{ fontFamily: "var(--font-fredoka)", borderColor: "var(--tv-navy)", color: "var(--tv-navy)", backgroundColor: "transparent" }}
          >
            Import from Wardrobe
          </button>
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
          >
            + Create New
          </button>
        </div>

        {!hasPlannerOutfits ? (
          <div className="py-10 text-center">
            <p style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", fontSize: 18 }}>
              No outfits yet — add some above!
            </p>
          </div>
        ) : (
          <>
            {/* Card Stack */}
            <div className="relative" style={{ width: 280, height: 360 }}>
              {/* Peeking cards behind */}
              {([2, 1] as const).map((offset) => {
                const idx = currentIndex + offset;
                if (idx >= plannerOutfits.length) return null;
                const scale = offset === 2 ? 0.92 : 0.96;
                const ty = offset === 2 ? -16 : -8;
                return (
                  <div
                    key={plannerOutfits[idx].id}
                    className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                    style={{
                      backgroundColor: "var(--tv-navy)",
                      transform: `scale(${scale}) translateY(${ty}px)`,
                      transformOrigin: "top center",
                      zIndex: offset === 2 ? 1 : 2,
                    }}
                  >
                    <div style={{ height: 4, backgroundColor: "var(--tv-terracotta)" }} />
                    <div className="p-3 flex flex-col" style={{ height: "calc(100% - 4px)" }}>
                      <div className="rounded-xl flex-1 overflow-hidden">
                        <OutfitMiniCanvas items={plannerOutfits[idx].outfit.items} />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Active card */}
              {currentOutfit && (
                <div
                  ref={cardRef}
                  key={currentOutfit.id}
                  className="absolute inset-0 rounded-2xl overflow-hidden select-none"
                  style={{ backgroundColor: "var(--tv-navy)", zIndex: 10, cursor: "grab", willChange: "transform" }}
                  onMouseDown={handleCardMouseDown}
                  onTouchStart={handleCardTouchStart}
                  onClick={() => setEditorOutfit(currentOutfit.outfit)}
                >
                  <div style={{ height: 4, backgroundColor: "var(--tv-terracotta)", flexShrink: 0 }} />

                  {/* Delete × */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCurrent(); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute top-3 right-3 z-20 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
                  >
                    ✕
                  </button>

                  <div className="p-3 flex flex-col" style={{ height: "calc(100% - 4px)" }}>
                    <div className="rounded-xl flex-1 overflow-hidden">
                      <OutfitMiniCanvas items={currentOutfit.outfit.items} />
                    </div>
                    <div className="pt-3 text-center shrink-0">
                      <span style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)", fontSize: 16 }}>
                        {currentOutfit.outfit.name}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Progress + nav arrows */}
            <div className="flex items-center gap-6">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 disabled:opacity-30"
                style={{ borderColor: "var(--tv-navy)", color: "var(--tv-navy)", backgroundColor: "white" }}
              >
                ‹
              </button>
              <span style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", fontSize: 16 }}>
                {currentIndex + 1} / {plannerOutfits.length}
              </span>
              <button
                onClick={goNext}
                disabled={currentIndex >= plannerOutfits.length - 1}
                className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 disabled:opacity-30"
                style={{ borderColor: "var(--tv-navy)", color: "var(--tv-navy)", backgroundColor: "white" }}
              >
                ›
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
