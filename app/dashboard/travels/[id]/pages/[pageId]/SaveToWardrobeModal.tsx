'use client';

import { useEffect, useState } from "react";
import { type Outfit } from "@/app/components/OutfitEditorModal";

type Folder = { id: string; name: string };

type SaveToWardrobeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  outfit: Outfit | null;
  onSaved: () => void;
};

export function SaveToWardrobeModal({ isOpen, onClose, outfit, onSaved }: SaveToWardrobeModalProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedFolderId(null);
    setLoading(true);
    fetch("/api/outfits")
      .then((r) => r.json())
      .then(({ folders: f }) => {
        setFolders(f ?? []);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen || !outfit) return null;

  async function handleSave() {
    if (!outfit) return;
    setSaving(true);
    await fetch(`/api/outfits/${outfit.id}/save-to-wardrobe`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: selectedFolderId }),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "var(--tv-cream)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: "var(--tv-navy)" }}
        >
          <h2
            className="text-xl"
            style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}
          >
            Save to Wardrobe
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
        <div className="p-6">
          <p
            className="text-xs mb-0.5"
            style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
          >
            Outfit
          </p>
          <p
            className="text-lg mb-5"
            style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}
          >
            {outfit.name}
          </p>

          <p
            className="text-sm mb-3"
            style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
          >
            Save to folder:
          </p>

          {loading ? (
            <div className="flex justify-center py-6">
              <div
                className="w-6 h-6 border-4 rounded-full animate-spin"
                style={{ borderColor: "var(--tv-navy)", borderTopColor: "transparent" }}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mb-6">
              <FolderButton
                label="No folder"
                selected={selectedFolderId === null}
                onClick={() => setSelectedFolderId(null)}
              />
              {folders.map((folder) => (
                <FolderButton
                  key={folder.id}
                  label={folder.name}
                  selected={selectedFolderId === folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                />
              ))}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl font-semibold transition-opacity hover:opacity-80 disabled:opacity-50 text-base"
            style={{
              fontFamily: "var(--font-fredoka)",
              backgroundColor: "var(--tv-terracotta)",
              color: "var(--tv-cream)",
            }}
          >
            {saving ? "Saving…" : "Save to Wardrobe"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FolderButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-xl text-sm font-semibold border-2 transition-all"
      style={{
        fontFamily: "var(--font-fredoka)",
        borderColor: selected ? "var(--tv-terracotta)" : "var(--tv-peach)",
        backgroundColor: selected ? "var(--tv-terracotta)" : "transparent",
        color: selected ? "var(--tv-cream)" : "var(--tv-navy)",
      }}
    >
      {label}
    </button>
  );
}
