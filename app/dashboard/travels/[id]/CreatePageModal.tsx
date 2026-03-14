'use client';

import { useState } from "react";
import { Modal } from "@/app/components/Modal";

type CreatePageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  travelPlanId: string;
  parentPageId: string | null;
  parentDepth: number;
  parentTitle?: string;
  onSuccess: (page: any) => void;
};

export function CreatePageModal({
  isOpen,
  onClose,
  travelPlanId,
  parentPageId,
  parentDepth,
  parentTitle,
  onSuccess,
}: CreatePageModalProps) {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isDepthError = parentDepth >= 4;

  const handleClose = () => {
    setTitle("");
    setError("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    if (isDepthError) { setError("Maximum depth reached"); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/travel-plans/${travelPlanId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, parentPageId }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to create page"); return; }
      onSuccess(json.data);
      handleClose();
    } catch {
      setError("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={parentPageId ? "Add Subpage" : "New Page"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {parentTitle && (
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            Creating under: <span className="font-medium text-gray-700">{parentTitle}</span>
          </div>
        )}
        {isDepthError && (
          <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg border border-amber-200">
            Cannot add more subpages — maximum depth of 4 reached.
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Page title..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
            disabled={isDepthError}
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isLoading || isDepthError}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50">
            {isLoading ? "Creating..." : "Create Page"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
