'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { type Outfit } from "@/app/components/OutfitEditorModal";
import { SaveToWardrobeModal } from "./SaveToWardrobeModal";

type PlannerOutfit = {
  id: string;
  outfitId: string;
  outfit: Outfit;
};

export function ClosetCarousel({ pageId }: { pageId: string }) {
  const [plannerOutfits, setPlannerOutfits] = useState<PlannerOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [overlay, setOverlay] = useState<"save" | "skip" | null>(null);
  const [saveModalOutfit, setSaveModalOutfit] = useState<Outfit | null>(null);

  // Drag state — all stored in a ref to avoid stale closures in DOM listeners
  const drag = useRef({ isDragging: false, startX: 0, currentDelta: 0 });
  // Prevent concurrent swipe animations
  const busy = useRef(false);
  // Ref to the active card DOM element for imperative transform manipulation
  const cardRef = useRef<HTMLDivElement>(null);
  // Stable refs so DOM event listeners always see latest values
  const plannerOutfitsRef = useRef<PlannerOutfit[]>([]);
  const currentIndexRef = useRef(0);
  plannerOutfitsRef.current = plannerOutfits;
  currentIndexRef.current = currentIndex;

  useEffect(() => {
    fetch(`/api/planner/${pageId}/outfits`)
      .then((r) => r.json())
      .then((data) => {
        setPlannerOutfits(data.plannerOutfits ?? []);
        setLoading(false);
      });
  }, [pageId]);

  // Advance to the next card after a swipe animation completes
  const advanceIndex = useCallback(() => {
    busy.current = false;
    drag.current.currentDelta = 0;
    setOverlay(null);
    setCurrentIndex((i) => i + 1);
  }, []);

  // Fly the current card out to the left
  const swipeLeft = useCallback(() => {
    if (busy.current) return;
    busy.current = true;
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.35s ease";
      cardRef.current.style.transform = "translateX(-450px) rotate(-22deg)";
    }
    setTimeout(advanceIndex, 350);
  }, [advanceIndex]);

  // Spring card back to centre and open the save modal
  const openSaveModal = useCallback(() => {
    if (busy.current) return;
    const outfits = plannerOutfitsRef.current;
    const idx = currentIndexRef.current;
    if (idx >= outfits.length) return;
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.3s ease";
      cardRef.current.style.transform = "translateX(0) rotate(0deg)";
    }
    drag.current.currentDelta = 0;
    setOverlay(null);
    setSaveModalOutfit(outfits[idx].outfit);
  }, []);

  // Called when the user confirms the save in the modal
  const handleSaved = useCallback(() => {
    setSaveModalOutfit(null);
    busy.current = true;
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.35s ease";
      cardRef.current.style.transform = "translateX(450px) rotate(22deg)";
    }
    setTimeout(advanceIndex, 350);
  }, [advanceIndex]);

  // Attach global mouse/touch listeners — avoids losing the drag if pointer
  // moves outside the card element
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!drag.current.isDragging || !cardRef.current) return;
      const delta = e.clientX - drag.current.startX;
      drag.current.currentDelta = delta;
      cardRef.current.style.transform = `translateX(${delta}px) rotate(${delta * 0.05}deg)`;
      setOverlay(delta > 30 ? "save" : delta < -30 ? "skip" : null);
    }

    function onTouchMove(e: TouchEvent) {
      if (!drag.current.isDragging || !cardRef.current) return;
      const delta = e.touches[0].clientX - drag.current.startX;
      drag.current.currentDelta = delta;
      cardRef.current.style.transform = `translateX(${delta}px) rotate(${delta * 0.05}deg)`;
      setOverlay(delta > 30 ? "save" : delta < -30 ? "skip" : null);
    }

    function onRelease() {
      if (!drag.current.isDragging) return;
      drag.current.isDragging = false;
      const delta = drag.current.currentDelta;
      if (delta > 80) {
        openSaveModal();
      } else if (delta < -80) {
        swipeLeft();
      } else {
        // Spring back to centre
        if (cardRef.current) {
          cardRef.current.style.transition = "transform 0.3s ease";
          cardRef.current.style.transform = "translateX(0) rotate(0deg)";
        }
        setOverlay(null);
        drag.current.currentDelta = 0;
      }
    }

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
  }, [openSaveModal, swipeLeft]);

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

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  if (plannerOutfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-2">
        <p
          className="text-center"
          style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", fontSize: 18 }}
        >
          Add outfits in the section above first.
        </p>
      </div>
    );
  }

  const allSwiped = currentIndex >= plannerOutfits.length;

  return (
    <>
      <SaveToWardrobeModal
        isOpen={saveModalOutfit !== null}
        outfit={saveModalOutfit}
        onClose={() => setSaveModalOutfit(null)}
        onSaved={handleSaved}
      />

      <div className="flex flex-col items-center gap-6 py-6">
        {allSwiped ? (
          /* ── All cards swiped ── */
          <div className="flex flex-col items-center gap-4 py-10">
            <p
              className="text-center"
              style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", fontSize: 20 }}
            >
              You&apos;ve gone through all your outfits!
            </p>
            <button
              onClick={() => {
                setCurrentIndex(0);
                setOverlay(null);
                busy.current = false;
              }}
              className="px-5 py-2 rounded-xl font-semibold transition-opacity hover:opacity-80"
              style={{
                fontFamily: "var(--font-fredoka)",
                backgroundColor: "var(--tv-terracotta)",
                color: "var(--tv-cream)",
              }}
            >
              Start Over
            </button>
          </div>
        ) : (
          <>
            {/* ── Card stack ── */}
            <div className="relative" style={{ width: 280, height: 360 }}>
              {/* Background peeking cards (rendered first so they sit behind) */}
              {([2, 1] as const).map((offset) => {
                const idx = currentIndex + offset;
                if (idx >= plannerOutfits.length) return null;
                const scale = offset === 2 ? 0.92 : 0.96;
                const ty = offset === 2 ? 16 : 8;
                return (
                  <div
                    key={plannerOutfits[idx].id}
                    className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none"
                    style={{
                      backgroundColor: "var(--tv-navy)",
                      transform: `scale(${scale}) translateY(${ty}px)`,
                      transformOrigin: "bottom center",
                      zIndex: offset === 2 ? 1 : 2,
                    }}
                  >
                    <OutfitCardContent outfit={plannerOutfits[idx].outfit} />
                  </div>
                );
              })}

              {/* Active (top) card — transform managed imperatively; no transform in
                  style prop so React re-renders don't overwrite live drag values */}
              <div
                ref={cardRef}
                key={plannerOutfits[currentIndex].id}
                className="absolute inset-0 rounded-2xl overflow-hidden select-none"
                style={{
                  backgroundColor: "var(--tv-navy)",
                  zIndex: 10,
                  cursor: "grab",
                  willChange: "transform",
                }}
                onMouseDown={handleCardMouseDown}
                onTouchStart={handleCardTouchStart}
              >
                {/* SAVE overlay */}
                {overlay === "save" && (
                  <div
                    className="absolute top-5 left-5 z-20 px-3 py-1 rounded-lg border-4 pointer-events-none"
                    style={{
                      borderColor: "#22c55e",
                      color: "#22c55e",
                      transform: "rotate(-12deg)",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-fredoka)",
                        fontSize: 26,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      SAVE
                    </span>
                  </div>
                )}

                {/* SKIP overlay */}
                {overlay === "skip" && (
                  <div
                    className="absolute top-5 right-5 z-20 px-3 py-1 rounded-lg border-4 pointer-events-none"
                    style={{
                      borderColor: "#ef4444",
                      color: "#ef4444",
                      transform: "rotate(12deg)",
                      userSelect: "none",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-fredoka)",
                        fontSize: 26,
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      SKIP
                    </span>
                  </div>
                )}

                <OutfitCardContent outfit={plannerOutfits[currentIndex].outfit} />
              </div>
            </div>

            {/* Progress indicator */}
            <p
              style={{
                fontFamily: "var(--font-fredoka)",
                color: "var(--tv-navy)",
                fontSize: 18,
              }}
            >
              {currentIndex + 1} / {plannerOutfits.length}
            </p>

            {/* Swipe hint buttons */}
            <div className="flex gap-8 items-center">
              <button
                onClick={swipeLeft}
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl border-2 transition-transform hover:scale-110 active:scale-95"
                style={{
                  borderColor: "var(--tv-terracotta)",
                  color: "var(--tv-terracotta)",
                  backgroundColor: "white",
                }}
                aria-label="Skip outfit"
              >
                ✕
              </button>
              <button
                onClick={openSaveModal}
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border-2 transition-transform hover:scale-110 active:scale-95"
                style={{
                  borderColor: "#22c55e",
                  color: "#22c55e",
                  backgroundColor: "white",
                }}
                aria-label="Save outfit to wardrobe"
              >
                ♡
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

function OutfitCardContent({ outfit }: { outfit: Outfit }) {
  return (
    <>
      {/* Terracotta accent strip */}
      <div style={{ height: 4, backgroundColor: "var(--tv-terracotta)", flexShrink: 0 }} />

      <div className="p-4 flex flex-col" style={{ height: "calc(100% - 4px)" }}>
        {/* Mini collage canvas */}
        <div
          className="rounded-xl w-full relative overflow-hidden flex-1"
          style={{ backgroundColor: "white", minHeight: 240 }}
        >
          {outfit.items.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span
                style={{ fontFamily: "var(--font-nunito)", color: "#ccc", fontSize: 12 }}
              >
                Empty
              </span>
            </div>
          ) : (
            outfit.items.map((item) => (
              <img
                key={item.id}
                src={item.clothingItem.imageUrl}
                alt=""
                draggable={false}
                style={{
                  position: "absolute",
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: "translate(-50%, -50%)",
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

        {/* Outfit name */}
        <div className="pt-3 text-center shrink-0">
          <span
            style={{
              fontFamily: "var(--font-fredoka)",
              color: "var(--tv-cream)",
              fontSize: 18,
            }}
          >
            {outfit.name}
          </span>
        </div>
      </div>
    </>
  );
}
