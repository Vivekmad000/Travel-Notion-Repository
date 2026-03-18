'use client';

import { useState } from "react";

type CreatePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  travelPlanId: string;
  parentPageId: string | null;
  parentDepth: number;
  parentTitle?: string;
  defaultTitle?: string;
  templateSlug?: string;
  onSuccess: (page: any) => void;
};

export function CreatePageModal({
  isOpen, onClose, travelPlanId, parentPageId, parentDepth, parentTitle, defaultTitle = "", templateSlug, onSuccess,
}: CreatePageModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isDepthError = parentDepth >= 4;

  const handleClose = () => { setTitle(defaultTitle); setError(""); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (isDepthError) { setError("Maximum depth reached"); return; }
    setIsLoading(true); setError("");
    try {
      const res = await fetch(`/api/travel-plans/${travelPlanId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentPageId, templateSlug }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to create page"); return; }
      onSuccess(json.data);
      handleClose();
    } catch { setError("Something went wrong."); }
    finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "var(--tv-cream)" }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ backgroundColor: "var(--tv-navy)" }}>
          <h2 className="text-2xl" style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}>
            {parentPageId ? "Add Subpage" : "New Page"}
          </h2>
          <button onClick={handleClose} className="text-xl hover:opacity-60 transition-opacity" style={{ color: "var(--tv-cream)" }}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {parentTitle && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ fontFamily: "var(--font-nunito)", backgroundColor: "rgba(53,82,172,0.08)", color: "var(--tv-blue)" }}>
              Adding under: <span className="font-semibold">{parentTitle}</span>
            </div>
          )}
          {isDepthError && (
            <div className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: "#fef3c7", color: "#92400e", fontFamily: "var(--font-nunito)" }}>
              Cannot add more subpages — maximum depth of 4 reached.
            </div>
          )}
          {error && (
            <div className="text-sm px-4 py-3 rounded-lg" style={{ backgroundColor: "#fee2e2", color: "#b91c1c", fontFamily: "var(--font-nunito)" }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}>
              Title <span style={{ color: "var(--tv-terracotta)" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title..."
              autoFocus
              disabled={isDepthError}
              className="w-full px-3 py-2 rounded-lg border outline-none"
              style={{ fontFamily: "var(--font-nunito)", borderColor: "var(--tv-navy)", color: "var(--tv-navy)", backgroundColor: "white" }}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-80 transition-opacity"
              style={{ fontFamily: "var(--font-fredoka)", border: "1.5px solid var(--tv-navy)", color: "var(--tv-navy)", backgroundColor: "transparent" }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading || isDepthError}
              className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              style={{ fontFamily: "var(--font-fredoka)", backgroundColor: "var(--tv-terracotta)", color: "var(--tv-cream)" }}>
              {isLoading ? "Creating..." : "Create Page"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
