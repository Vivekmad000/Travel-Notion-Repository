'use client';

import { useEffect, useState } from "react";
import { type Outfit } from "@/app/components/OutfitEditorModal";

type Folder = { id: string; name: string };

type ImportOutfitModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedIds: string[]) => void;
  alreadyAddedIds: string[];
};

export function ImportOutfitModal({ isOpen, onClose, onImport, alreadyAddedIds }: ImportOutfitModalProps) {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set());
    fetch("/api/outfits")
      .then((r) => r.json())
      .then(({ folders, outfits }) => {
        setFolders(folders ?? []);
        setOutfits(outfits ?? []);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  function toggleSelect(id: string) {
    if (alreadyAddedIds.includes(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleImport() {
    onImport(Array.from(selected));
    onClose();
  }

  const ungrouped = outfits.filter((o) => !o.folderId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{ backgroundColor: "var(--tv-cream)", maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ backgroundColor: "var(--tv-navy)" }}
        >
          <h2
            className="text-xl"
            style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}
          >
            Import from Wardrobe
          </h2>
          <button
            onClick={onClose}
            className="text-xl hover:opacity-60 transition-opacity"
            style={{ color: "var(--tv-cream)" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <div
                className="w-8 h-8 border-4 rounded-full animate-spin"
                style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }}
              />
            </div>
          ) : outfits.length === 0 ? (
            <p
              className="text-center py-16"
              style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
            >
              No outfits in your wardrobe yet.
            </p>
          ) : (
            <>
              {/* Ungrouped */}
              {ungrouped.length > 0 && (
                <div className="mb-6">
                  {folders.length > 0 && (
                    <p
                      className="text-xs mb-2 uppercase tracking-wide"
                      style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}
                    >
                      Ungrouped
                    </p>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {ungrouped.map((o) => (
                      <MiniOutfitCard
                        key={o.id}
                        outfit={o}
                        selected={selected.has(o.id)}
                        alreadyAdded={alreadyAddedIds.includes(o.id)}
                        onToggle={toggleSelect}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Folders */}
              {folders.map((folder) => {
                const folderOutfits = outfits.filter((o) => o.folderId === folder.id);
                if (folderOutfits.length === 0) return null;
                return (
                  <div key={folder.id} className="mb-6">
                    <p
                      className="text-xs mb-2 uppercase tracking-wide"
                      style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}
                    >
                      {folder.name}
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {folderOutfits.map((o) => (
                        <MiniOutfitCard
                          key={o.id}
                          outfit={o}
                          selected={selected.has(o.id)}
                          alreadyAdded={alreadyAddedIds.includes(o.id)}
                          onToggle={toggleSelect}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-6 py-4 flex items-center justify-between border-t"
          style={{ borderColor: "var(--tv-peach)", backgroundColor: "var(--tv-cream)" }}
        >
          <span
            className="text-sm"
            style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
          >
            {selected.size > 0 ? `${selected.size} selected` : "Click outfits to select"}
          </span>
          <button
            onClick={handleImport}
            disabled={selected.size === 0}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
            style={{
              fontFamily: "var(--font-fredoka)",
              backgroundColor: "var(--tv-terracotta)",
              color: "var(--tv-cream)",
            }}
          >
            Add {selected.size > 0 ? `${selected.size} ` : ""}Outfit{selected.size !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniOutfitCard({
  outfit,
  selected,
  alreadyAdded,
  onToggle,
}: {
  outfit: Outfit;
  selected: boolean;
  alreadyAdded: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(outfit.id)}
      disabled={alreadyAdded}
      className="rounded-xl overflow-hidden text-left transition-all"
      style={{
        backgroundColor: "var(--tv-navy)",
        opacity: alreadyAdded ? 0.5 : 1,
        outline: selected ? "2.5px solid var(--tv-terracotta)" : "2.5px solid transparent",
        cursor: alreadyAdded ? "default" : "pointer",
      }}
    >
      <div className="h-0.5" style={{ backgroundColor: selected ? "var(--tv-terracotta)" : "var(--tv-blue)" }} />
      <div className="p-2">
        {/* Mini collage */}
        <div
          className="rounded-lg w-full relative overflow-hidden"
          style={{ backgroundColor: "white", height: 100 }}
        >
          {alreadyAdded && (
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
            >
              <span className="text-2xl">✓</span>
            </div>
          )}
          {outfit.items.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontFamily: "var(--font-nunito)", color: "#ccc", fontSize: 10 }}>Empty</span>
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
                  width: 44,
                  height: 44,
                  objectFit: "contain",
                  zIndex: item.zIndex,
                  pointerEvents: "none",
                }}
              />
            ))
          )}
        </div>
        <p
          className="mt-1.5 text-xs truncate"
          style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}
        >
          {outfit.name}
        </p>
      </div>
    </button>
  );
}
