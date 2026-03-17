"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { MyOutfitsTab } from "./MyOutfitsTab";

const { uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: "/api/uploadthing",
});

type ClothingItem = {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
};

const CATEGORIES = ["top", "bottom", "shoes", "accessory", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  top: "Tops",
  bottom: "Bottoms",
  shoes: "Shoes",
  accessory: "Accessories",
  other: "Other",
};

// ─── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSaved }: { onClose: () => void; onSaved: (item: ClothingItem) => void }) {
  const [step, setStep] = useState<"pick" | "processing" | "confirm">("pick");
  const [preview, setPreview] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("top");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setOriginalFile(file);
    setStep("processing");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/remove-bg", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "remove.bg failed");
      setPreview(data.imageData);
      setStep("confirm");
    } catch (e) {
      setError((e as Error).message);
      setStep("pick");
    }
  }

  async function handleSave() {
    if (!preview || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      // Convert base64 data URL → File
      const blob = await fetch(preview).then((r) => r.blob());
      const pngFile = new File([blob], `${name.trim().replace(/\s+/g, "_")}.png`, { type: "image/png" });

      // Upload to UploadThing
      const uploaded = await uploadFiles("imageUploader", { files: [pngFile] });
      const imageUrl = uploaded[0]?.url;
      if (!imageUrl) throw new Error("Upload failed");

      // Save to DB
      const res = await fetch("/api/clothing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), imageUrl, category }),
      });
      const item = await res.json();
      if (!res.ok) throw new Error(item.error || "Save failed");
      onSaved(item);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: "var(--tv-cream)" }}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lg font-bold hover:opacity-60 transition-opacity"
          style={{ color: "var(--tv-navy)" }}
        >
          ✕
        </button>

        <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
          Add to Closet
        </h2>

        {error && (
          <p className="mb-3 text-sm rounded-lg px-3 py-2" style={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontFamily: "var(--font-nunito)" }}>
            {error}
          </p>
        )}

        {step === "pick" && (
          <div
            className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer hover:opacity-70 transition-opacity"
            style={{ borderColor: "var(--tv-navy)" }}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Image src="/assets/pencil.png" alt="" width={40} height={40} style={{ margin: "0 auto 12px", opacity: 0.6 }} />
            <p style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)", fontSize: 16 }}>
              Drag & drop or click to upload
            </p>
            <p style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)", fontSize: 13, marginTop: 4 }}>
              Background will be automatically removed
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>
        )}

        {step === "processing" && (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 rounded-full animate-spin" style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }} />
            <p style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>Removing background…</p>
          </div>
        )}

        {step === "confirm" && preview && (
          <div className="flex flex-col gap-4">
            {/* Preview */}
            <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ backgroundColor: "var(--tv-navy)", height: 220 }}>
              <img src={preview} alt="preview" style={{ maxHeight: 200, maxWidth: "100%", objectFit: "contain" }} />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm mb-1" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
                Item Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. White linen shirt"
                className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                style={{ fontFamily: "var(--font-nunito)", borderColor: "var(--tv-navy)", backgroundColor: "white", color: "var(--tv-navy)" }}
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm mb-2" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className="px-3 py-1 rounded-full text-sm transition-colors"
                    style={{
                      fontFamily: "var(--font-fredoka)",
                      backgroundColor: category === c ? "var(--tv-terracotta)" : "var(--tv-navy)",
                      color: "var(--tv-cream)",
                    }}
                  >
                    {CATEGORY_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition-opacity disabled:opacity-50"
              style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)", fontSize: 16 }}
            >
              {saving ? "Saving…" : "Save to Closet"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Clothing Item Card ───────────────────────────────────────────────────────

function ClothingCard({ item, onDelete }: { item: ClothingItem; onDelete: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await fetch(`/api/clothing/${item.id}`, { method: "DELETE" });
    onDelete(item.id);
  }

  return (
    <div className="group relative rounded-2xl overflow-hidden shadow-md" style={{ backgroundColor: "var(--tv-navy)" }}>
      <div className="h-1" style={{ backgroundColor: "var(--tv-terracotta)" }} />
      <div className="p-3 flex flex-col items-center">
        <div
          className="rounded-xl w-full flex items-center justify-center"
          style={{ backgroundColor: "white", height: 160 }}
        >
          <img src={item.imageUrl} alt={item.name} style={{ maxHeight: 148, maxWidth: "100%", objectFit: "contain" }} />
        </div>
        <p className="mt-2 text-sm text-center font-semibold truncate w-full" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
          {item.name}
        </p>
        <span
          className="mt-1 text-xs px-2 py-0.5 rounded-full"
          style={{ fontFamily: "var(--font-nunito)", backgroundColor: "rgba(255,255,255,0.12)", color: "var(--tv-peach)", border: "1px solid var(--tv-blue)" }}
        >
          {CATEGORY_LABELS[item.category as Category] ?? item.category}
        </span>
      </div>
      {/* Delete button — shows on hover */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Main Outfits Client ──────────────────────────────────────────────────────

export function OutfitsClient() {
  const [tab, setTab] = useState<"closet" | "outfits">("closet");
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState<Category | "all">("all");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetch("/api/clothing")
      .then((r) => r.json())
      .then((data) => { setItems(data); setLoading(false); });
  }, []);

  const filtered = filterCat === "all" ? items : items.filter((i) => i.category === filterCat);

  function handleSaved(item: ClothingItem) {
    setItems((prev) => [item, ...prev]);
    setShowUpload(false);
  }

  return (
    <>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onSaved={handleSaved} />}

      {/* Tab switcher */}
      <div className="flex gap-1 mb-8 p-1 rounded-full w-fit" style={{ backgroundColor: "var(--tv-navy)" }}>
        {(["closet", "outfits"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-1.5 rounded-full text-sm font-semibold transition-colors"
            style={{
              fontFamily: "var(--font-fredoka)",
              color: "var(--tv-cream)",
              ...(tab === t ? { backgroundColor: "var(--tv-terracotta)" } : {}),
            }}
          >
            {t === "closet" ? "My Closet" : "My Outfits"}
          </button>
        ))}
      </div>

      {/* My Closet tab */}
      {tab === "closet" && (
        <div>
          {/* Controls row */}
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            {/* Category filter pills */}
            <div className="flex flex-wrap gap-2">
              {(["all", ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCat(c)}
                  className="px-3 py-1 rounded-full text-sm transition-colors"
                  style={{
                    fontFamily: "var(--font-fredoka)",
                    backgroundColor: filterCat === c ? "var(--tv-navy)" : "transparent",
                    color: filterCat === c ? "var(--tv-cream)" : "var(--tv-navy)",
                    border: "1.5px solid var(--tv-navy)",
                  }}
                >
                  {c === "all" ? "All" : CATEGORY_LABELS[c]}
                </button>
              ))}
            </div>

            {/* Add Item button */}
            <button
              onClick={() => setShowUpload(true)}
              className="px-5 py-2 rounded-xl text-sm font-semibold"
              style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}
            >
              + Add Item
            </button>
          </div>

          {/* Grid or empty state */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Image src="/assets/eyeglass.png" alt="" width={70} height={70} style={{ opacity: 0.5 }} />
              <h2 className="mt-6 text-2xl" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
                {items.length === 0 ? "Your closet is empty!" : "Nothing in this category"}
              </h2>
              <p className="mt-2 text-sm max-w-xs" style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}>
                {items.length === 0 ? "Add your first clothing item to get started." : "Try a different category filter."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filtered.map((item) => (
                <ClothingCard key={item.id} item={item} onDelete={(id) => setItems((prev) => prev.filter((i) => i.id !== id))} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Outfits tab — Phase 7C */}
      {tab === "outfits" && <MyOutfitsTab closetItems={items} />}
    </>
  );
}
