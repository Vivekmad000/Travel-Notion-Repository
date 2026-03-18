'use client';

import { useEffect, useState } from "react";
import { OutfitEditorModal, type ClothingItem, type Outfit } from "@/app/components/OutfitEditorModal";
import { ImportOutfitModal } from "./ImportOutfitModal";

type PlannerOutfit = {
  id: string;
  outfitId: string;
  outfit: Outfit;
};

export function PlannerOutfitsSection({ pageId }: { pageId: string }) {
  const [plannerOutfits, setPlannerOutfits] = useState<PlannerOutfit[]>([]);
  const [closetItems, setClosetItems] = useState<ClothingItem[]>([]);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editorOutfit, setEditorOutfit] = useState<Outfit | null>(null);
  const [loading, setLoading] = useState(true);

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
    const added = results
      .filter((r) => r.plannerOutfit)
      .map((r) => r.plannerOutfit as PlannerOutfit);
    setPlannerOutfits((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      return [...prev, ...added.filter((a) => !existingIds.has(a.id))];
    });
  }

  async function handleCreateNew() {
    // 1. Create a plannerOnly outfit
    const outfitRes = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Outfit", plannerOnly: true }),
    });
    const newOutfit = await outfitRes.json();

    // 2. Add it to the planner
    const plannerRes = await fetch(`/api/planner/${pageId}/outfits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outfitId: newOutfit.id }),
    });
    const { plannerOutfit } = await plannerRes.json();

    // 3. Add to state and open editor
    setPlannerOutfits((prev) => [...prev, plannerOutfit]);
    setEditorOutfit(plannerOutfit.outfit);
  }

  async function handleDelete(plannerOutfitId: string) {
    const po = plannerOutfits.find((p) => p.id === plannerOutfitId);
    if (!po) return;
    if (!confirm(`Remove "${po.outfit.name}" from this planner?`)) return;
    await fetch(`/api/planner/${pageId}/outfits/${plannerOutfitId}`, { method: "DELETE" });
    setPlannerOutfits((prev) => prev.filter((p) => p.id !== plannerOutfitId));
  }

  function handleEditorUpdate(updated: Outfit) {
    setPlannerOutfits((prev) =>
      prev.map((p) => p.outfitId === updated.id ? { ...p, outfit: updated } : p)
    );
  }

  const alreadyAddedIds = plannerOutfits.map((p) => p.outfitId);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div
          className="w-8 h-8 border-4 rounded-full animate-spin"
          style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Outfit editor modal */}
      {editorOutfit && (
        <OutfitEditorModal
          outfit={editorOutfit}
          closetItems={closetItems}
          onClose={() => setEditorOutfit(null)}
          onUpdate={handleEditorUpdate}
        />
      )}

      {/* Import modal */}
      <ImportOutfitModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        alreadyAddedIds={alreadyAddedIds}
      />

      {/* Action buttons */}
      <div className="flex gap-3 justify-end mb-5">
        <button
          onClick={() => setImportModalOpen(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-opacity hover:opacity-80"
          style={{
            fontFamily: "var(--font-fredoka)",
            borderColor: "var(--tv-navy)",
            color: "var(--tv-navy)",
            backgroundColor: "transparent",
          }}
        >
          Import from Wardrobe
        </button>
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{
            fontFamily: "var(--font-fredoka)",
            backgroundColor: "var(--tv-terracotta)",
            color: "var(--tv-cream)",
          }}
        >
          + Create New Outfit
        </button>
      </div>

      {/* Outfit grid */}
      {plannerOutfits.length === 0 ? (
        <div
          className="rounded-2xl p-10 flex flex-col items-center justify-center gap-3"
          style={{ backgroundColor: "white", border: "1.5px dashed var(--tv-peach)" }}
        >
          <p
            className="text-base"
            style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", opacity: 0.5 }}
          >
            No outfits yet
          </p>
          <p
            className="text-sm"
            style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", opacity: 0.6 }}
          >
            Import from your wardrobe or create a new outfit for this trip.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {plannerOutfits.map((po) => (
            <PlannerOutfitCard
              key={po.id}
              plannerOutfit={po}
              onEdit={() => setEditorOutfit(po.outfit)}
              onDelete={() => handleDelete(po.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

function PlannerOutfitCard({
  plannerOutfit,
  onEdit,
  onDelete,
}: {
  plannerOutfit: PlannerOutfit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { outfit } = plannerOutfit;
  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg transition-shadow"
      style={{ backgroundColor: "var(--tv-navy)" }}
      onClick={onEdit}
    >
      {/* Terracotta top strip */}
      <div className="h-px" style={{ backgroundColor: "var(--tv-terracotta)" }} />
      <div className="p-3">
        {/* Mini canvas */}
        <div
          className="rounded-xl w-full relative overflow-hidden"
          style={{ backgroundColor: "white", height: 160 }}
        >
          {outfit.items.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontFamily: "var(--font-nunito)", color: "#ccc", fontSize: 11 }}>Empty</span>
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
                }}
              />
            ))
          )}
        </div>
        <div className="h-7" />
      </div>

      {/* Outfit name — bottom left pill */}
      <span
        className="absolute bottom-2 left-2 text-xs px-2 py-0.5 rounded-full max-w-[65%] truncate"
        style={{
          fontFamily: "var(--font-fredoka)",
          backgroundColor: "rgba(255,255,255,0.12)",
          color: "var(--tv-cream)",
          border: "1px solid var(--tv-blue)",
        }}
      >
        {outfit.name}
      </span>

      {/* Delete — bottom right */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
        style={{ backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
      >
        ×
      </button>
    </div>
  );
}
