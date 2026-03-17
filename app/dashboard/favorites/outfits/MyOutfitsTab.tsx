"use client";

import { useEffect, useRef, useState, useCallback } from "react";import Image from "next/image";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
} from "@dnd-kit/core";

// ─── Types ───────────────────────────────────────────────────────────────────

type ClothingItem = { id: string; name: string; imageUrl: string; category: string };
type OutfitItem = { id: string; clothingItemId: string; x: number; y: number; zIndex: number; clothingItem: { imageUrl: string } };
type Outfit = { id: string; name: string; folderId: string | null; items: OutfitItem[] };
type Folder = { id: string; name: string };

// ─── Folder Drop Zone ─────────────────────────────────────────────────────────

function FolderZone({
  folder,
  outfits,
  isRenaming,
  onRename,
  onEditOutfit,
  onDeleteOutfit,
  onDeleteFolder,
  onCreateOutfit,
}: {
  folder: Folder;
  outfits: Outfit[];
  isRenaming: boolean;
  onRename: (id: string, name: string) => void;
  onEditOutfit: (outfit: Outfit) => void;
  onDeleteOutfit: (id: string) => void;
  onDeleteFolder: (id: string) => void;
  onCreateOutfit: (folderId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `folder-${folder.id}` });
  const [open, setOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [renameVal, setRenameVal] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Enter edit mode when first created (isRenaming prop)
  useEffect(() => {
    if (isRenaming) {
      setRenameVal(folder.name);
      setIsEditing(true);
    }
  }, [isRenaming]);

  useEffect(() => {
    if (isEditing) {
      setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 50);
    }
  }, [isEditing]);

  function commitRename() {
    const name = renameVal.trim() || folder.name;
    onRename(folder.id, name);
    setIsEditing(false);
  }

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl overflow-hidden mb-4 transition-all"
      style={{
        backgroundColor: isOver ? "rgba(53,82,172,0.18)" : "var(--tv-navy)",
        border: isOver ? "2px solid var(--tv-peach)" : "2px solid transparent",
      }}
    >
      {/* Folder header */}
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => !isEditing && setOpen((o) => !o)}>
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--tv-peach)", fontSize: 18 }}>{open ? "▾" : "▸"}</span>
          {isEditing ? (
            <input
              ref={inputRef}
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") { setRenameVal(folder.name); setIsEditing(false); } }}
              onClick={(e) => e.stopPropagation()}
              className="rounded px-2 py-0.5 text-base outline-none"
              style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", backgroundColor: "var(--tv-cream)", minWidth: 120 }}
            />
          ) : (
            <span
              style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)", fontSize: 18, cursor: "text" }}
              onDoubleClick={(e) => { e.stopPropagation(); setRenameVal(folder.name); setIsEditing(true); }}
            >
              {folder.name}
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ fontFamily: "var(--font-nunito)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
          >
            {outfits.length}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
          className="text-xs hover:opacity-60 transition-opacity"
          style={{ color: "var(--tv-peach)" }}
        >
          ✕
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {outfits.map((o) => (
              <OutfitCard key={o.id} outfit={o} onEdit={onEditOutfit} onDelete={onDeleteOutfit} />
            ))}
            <button
              onClick={() => onCreateOutfit(folder.id)}
              className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 py-8 hover:opacity-70 transition-opacity"
              style={{ borderColor: "var(--tv-blue)", color: "var(--tv-peach)" }}
            >
              <span style={{ fontSize: 24 }}>+</span>
              <span style={{ fontFamily: "var(--font-fredoka)", fontSize: 13 }}>New Outfit</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Outfit Card (draggable) ──────────────────────────────────────────────────

function OutfitCard({ outfit, onEdit, onDelete }: { outfit: Outfit; onEdit: (o: Outfit) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: outfit.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="relative rounded-2xl overflow-hidden shadow-md cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: "var(--tv-navy)", opacity: isDragging ? 0.4 : 1 }}
      onClick={() => onEdit(outfit)}
    >
      <div className="h-1" style={{ backgroundColor: "var(--tv-terracotta)" }} />
      <div className="p-3">
        {/* Mini collage — mirrors the real canvas at scale */}
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
        style={{ fontFamily: "var(--font-nunito)", backgroundColor: "rgba(255,255,255,0.12)", color: "var(--tv-peach)", border: "1px solid var(--tv-blue)" }}
      >
        {outfit.name}
      </span>
      {/* Delete — bottom right */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${outfit.name}"?`)) onDelete(outfit.id); }}
        className="absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity"
        style={{ backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Outfit Editor Modal ──────────────────────────────────────────────────────

function OutfitEditorModal({
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
    const rect = canvas.getBoundingClientRect();
    const item = outfit.items.find((i) => i.id === itemId);
    if (!item) return;
    draggingItem.current = { itemId, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y };
    bringToFront(itemId);
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

// ─── My Outfits Tab ───────────────────────────────────────────────────────────

export function MyOutfitsTab({ closetItems }: { closetItems: ClothingItem[] }) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    fetch("/api/outfits")
      .then((r) => r.json())
      .then(({ folders, outfits }) => { setFolders(folders); setOutfits(outfits); setLoading(false); });
  }, []);

  async function createFolder() {
    const existingCount = folders.length + 1;
    const name = `Folder ${existingCount}`;
    const res = await fetch("/api/folders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const folder = await res.json();
    setFolders((prev) => [...prev, folder]);
    setRenamingFolderId(folder.id);
  }

  async function renameFolder(id: string, name: string) {
    if (!name.trim()) return;
    await fetch(`/api/folders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name: name.trim() } : f));
    setRenamingFolderId(null);
  }

  async function deleteFolder(id: string) {
    if (!confirm("Delete this folder? Outfits inside will become ungrouped.")) return;
    await fetch(`/api/folders/${id}`, { method: "DELETE" });
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setOutfits((prev) => prev.map((o) => o.folderId === id ? { ...o, folderId: null } : o));
  }

  async function createOutfit(folderId: string | null = null) {
    const res = await fetch("/api/outfits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "New Outfit", folderId }) });
    const outfit = await res.json();
    setOutfits((prev) => [outfit, ...prev]);
    setEditingOutfit(outfit);
  }

  async function deleteOutfit(id: string) {
    await fetch(`/api/outfits/${id}`, { method: "DELETE" });
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const outfitId = active.id as string;
    const overId = over.id as string;

    if (overId === "unfoldered") {
      // Drop into ungrouped area
      const outfit = outfits.find((o) => o.id === outfitId);
      if (!outfit || outfit.folderId === null) return;
      fetch(`/api/outfits/${outfitId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId: null }) });
      setOutfits((prev) => prev.map((o) => o.id === outfitId ? { ...o, folderId: null } : o));
    } else if (overId.startsWith("folder-")) {
      const folderId = overId.replace("folder-", "");
      const outfit = outfits.find((o) => o.id === outfitId);
      if (!outfit || outfit.folderId === folderId) return;
      fetch(`/api/outfits/${outfitId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folderId }) });
      setOutfits((prev) => prev.map((o) => o.id === outfitId ? { ...o, folderId } : o));
    }
  }

  const ungrouped = outfits.filter((o) => !o.folderId);
  const { setNodeRef: ungroupedRef, isOver: ungroupedOver } = useDroppable({ id: "unfoldered" });
  const activeOutfit = outfits.find((o) => o.id === activeDragId);

  if (loading) return (
    <div className="py-20 flex justify-center">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd}>
      {editingOutfit && (
        <OutfitEditorModal
          outfit={editingOutfit}
          closetItems={closetItems}
          onClose={() => setEditingOutfit(null)}
          onUpdate={(updated) => setOutfits((prev) => prev.map((o) => o.id === updated.id ? updated : o))}
        />
      )}

      {/* Top controls */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => createOutfit(null)}
          className="px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
        >
          + New Outfit
        </button>
        <button
          onClick={createFolder}
          className="px-5 py-2 rounded-xl text-sm font-semibold"
          style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-navy)", color: "var(--tv-cream)" }}
        >
          + New Folder
        </button>
      </div>

      {/* Folders */}
      {folders.map((folder) => (
        <FolderZone
          key={folder.id}
          folder={folder}
          outfits={outfits.filter((o) => o.folderId === folder.id)}
          isRenaming={renamingFolderId === folder.id}
          onRename={renameFolder}
          onEditOutfit={setEditingOutfit}
          onDeleteOutfit={deleteOutfit}
          onDeleteFolder={deleteFolder}
          onCreateOutfit={createOutfit}
        />
      ))}

      {/* Ungrouped outfits */}
      <div
        ref={ungroupedRef}
        className="rounded-2xl p-4 min-h-24 transition-all"
        style={{
          backgroundColor: ungroupedOver ? "rgba(53,82,172,0.1)" : "transparent",
          border: ungroupedOver ? "2px dashed var(--tv-peach)" : "2px dashed transparent",
        }}
      >
        {folders.length > 0 && (
          <p className="text-xs mb-3" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}>
            Ungrouped
          </p>
        )}
        {ungrouped.length === 0 && !ungroupedOver ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Image src="/assets/eyeglass.png" alt="" width={60} height={60} style={{ opacity: 0.4 }} />
            <p className="mt-4" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>No outfits yet!</p>
            <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}>Click "+ New Outfit" to create your first one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {ungrouped.map((o) => (
              <OutfitCard key={o.id} outfit={o} onEdit={setEditingOutfit} onDelete={deleteOutfit} />
            ))}
          </div>
        )}
      </div>

      <DragOverlay>
        {activeOutfit && (
          <div className="rounded-xl shadow-2xl opacity-90 w-32" style={{ backgroundColor: "var(--tv-navy)" }}>
            <div className="h-1" style={{ backgroundColor: "var(--tv-terracotta)" }} />
            <p className="px-2 py-1 text-xs" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>{activeOutfit.name}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
