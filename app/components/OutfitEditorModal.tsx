'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type ClothingItem = { id: string; name: string; imageUrl: string; category: string };
export type OutfitItem = { id: string; clothingItemId: string; x: number; y: number; zIndex: number; clothingItem: { imageUrl: string } };
export type Outfit = { id: string; name: string; plannerOnly?: boolean; folderId: string | null; items: OutfitItem[] };

// ─── Outfit Editor Modal ──────────────────────────────────────────────────────

export function OutfitEditorModal({
  outfit: initialOutfit,
  closetItems,
  onClose,
  onUpdate,
}: {
  outfit: Outfit;
  closetItems: ClothingItem[];
  onClose: () => void;
  onUpdate: (updated: Outfit) => void;
}) {
  const [outfit, setOutfit] = useState<Outfit>(initialOutfit);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(outfit.name);
  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingItem = useRef<{ itemId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  // Always hold latest outfit for use inside window event listeners (avoids stale closure)
  const outfitRef = useRef(outfit);
  useEffect(() => { outfitRef.current = outfit; }, [outfit]);

  // Propagate final state to parent when modal closes
  useEffect(() => {
    return () => { onUpdate(outfitRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save name
  async function saveName() {
    if (!nameVal.trim() || nameVal === outfit.name) { setEditingName(false); return; }
    await fetch(`/api/outfits/${outfit.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: nameVal.trim() }) });
    const updated = { ...outfit, name: nameVal.trim() };
    setOutfit(updated);
    onUpdate(updated);
    setEditingName(false);
  }

  // Add item to canvas
  async function addItem(clothingItemId: string) {
    const res = await fetch(`/api/outfits/${outfit.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clothingItemId }),
    });
    const newItem = await res.json();
    const updated = { ...outfit, items: [...outfit.items, newItem] };
    setOutfit(updated);
    onUpdate(updated);
  }

  // Remove item
  async function removeItem(itemId: string) {
    await fetch(`/api/outfits/${outfit.id}/items/${itemId}`, { method: "DELETE" });
    const updated = { ...outfit, items: outfit.items.filter((i) => i.id !== itemId) };
    setOutfit(updated);
    onUpdate(updated);
  }

  // Bring item to front
  async function bringToFront(itemId: string) {
    const maxZ = Math.max(0, ...outfit.items.map((i) => i.zIndex));
    const newZ = maxZ + 1;
    await fetch(`/api/outfits/${outfit.id}/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zIndex: newZ }),
    });
    setOutfit((prev) => ({
      ...prev,
      items: prev.items.map((i) => i.id === itemId ? { ...i, zIndex: newZ } : i),
    }));
  }

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const item = outfit.items.find((i) => i.id === itemId);
    if (!item) return;
    draggingItem.current = { itemId, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y };
    bringToFront(itemId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outfit.items]);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!draggingItem.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - draggingItem.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - draggingItem.current.startY) / rect.height) * 100;
      const newX = Math.max(5, Math.min(95, draggingItem.current.origX + dx));
      const newY = Math.max(5, Math.min(95, draggingItem.current.origY + dy));
      const itemId = draggingItem.current.itemId;
      setOutfit((prev) => ({
        ...prev,
        items: prev.items.map((i) => i.id === itemId ? { ...i, x: newX, y: newY } : i),
      }));
    }

    function handleMouseUp(e: MouseEvent) {
      if (!draggingItem.current || !canvasRef.current) return;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const dx = ((e.clientX - draggingItem.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - draggingItem.current.startY) / rect.height) * 100;
      const newX = Math.max(5, Math.min(95, draggingItem.current.origX + dx));
      const newY = Math.max(5, Math.min(95, draggingItem.current.origY + dy));
      const itemId = draggingItem.current.itemId;
      fetch(`/api/outfits/${outfitRef.current.id}/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x: newX, y: newY }),
      });
      // Build updated outfit and propagate to parent so position persists on reopen
      const updatedOutfit = {
        ...outfitRef.current,
        items: outfitRef.current.items.map((i) => i.id === itemId ? { ...i, x: newX, y: newY } : i),
      };
      onUpdate(updatedOutfit);
      draggingItem.current = null;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [outfit.id]);

  const sortedItems = [...outfit.items].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
      <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col" style={{ backgroundColor: "var(--tv-cream)", maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ backgroundColor: "var(--tv-navy)" }}>
          <div className="flex items-center gap-3">
            {editingName ? (
              <input
                autoFocus
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => e.key === "Enter" && saveName()}
                className="rounded-lg px-2 py-1 text-lg outline-none"
                style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", backgroundColor: "var(--tv-cream)" }}
              />
            ) : (
              <h2
                className="text-2xl cursor-pointer hover:opacity-70 transition-opacity"
                style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}
                onClick={() => setEditingName(true)}
              >
                {outfit.name} <span style={{ fontSize: 14, color: "var(--tv-peach)" }}>✎</span>
              </h2>
            )}
          </div>
          <button onClick={onClose} className="text-xl hover:opacity-60 transition-opacity" style={{ color: "var(--tv-cream)" }}>✕</button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas — left 65% */}
          <div
            ref={canvasRef}
            className="relative flex-1 overflow-hidden"
            style={{ backgroundColor: "#f7f3ea", minHeight: 480 }}
          >
            {sortedItems.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Image src="/assets/eyeglass.png" alt="" width={60} height={60} style={{ opacity: 0.3 }} />
                <p style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", opacity: 0.4, marginTop: 12 }}>
                  Add items from the right panel
                </p>
              </div>
            )}
            {sortedItems.map((item) => (
              <img
                key={item.id}
                src={item.clothingItem.imageUrl}
                alt=""
                onMouseDown={(e) => handleMouseDown(e, item.id)}
                style={{
                  position: "absolute",
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: 120,
                  height: 120,
                  objectFit: "contain",
                  cursor: "grab",
                  zIndex: item.zIndex,
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.15))",
                }}
                draggable={false}
              />
            ))}
          </div>

          {/* Side panel — right 35% */}
          <div className="w-72 shrink-0 flex flex-col overflow-hidden border-l" style={{ borderColor: "var(--tv-peach)" }}>
            {/* Add Item section */}
            <div className="flex-1 overflow-y-auto p-4 border-b" style={{ borderColor: "var(--tv-peach)" }}>
              <h3 className="text-base mb-3" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
                Add Item
              </h3>
              {closetItems.length === 0 ? (
                <p style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", fontSize: 13 }}>
                  Your closet is empty. Add items in My Closet first.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {closetItems.map((ci) => (
                    <button
                      key={ci.id}
                      onClick={() => addItem(ci.id)}
                      title={ci.name}
                      className="rounded-lg p-1.5 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "var(--tv-navy)" }}
                    >
                      <img src={ci.imageUrl} alt={ci.name} style={{ width: "100%", height: 44, objectFit: "contain" }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In this Outfit section */}
            <div className="flex-1 overflow-y-auto p-4">
              <h3 className="text-base mb-3" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
                In this Outfit ({outfit.items.length})
              </h3>
              {outfit.items.length === 0 ? (
                <p style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", fontSize: 13 }}>No items yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {outfit.items.map((oi) => {
                    const ci = closetItems.find((c) => c.id === oi.clothingItemId);
                    return (
                      <div key={oi.id} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: "var(--tv-navy)" }}>
                        <img src={oi.clothingItem.imageUrl} alt="" style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }} />
                        <span className="flex-1 text-xs truncate" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
                          {ci?.name ?? "Item"}
                        </span>
                        <button
                          onClick={() => removeItem(oi.id)}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 hover:opacity-70"
                          style={{ backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
