'use client';

import { useState, useEffect } from "react";
import { Modal } from "@/app/components/Modal";

type TravelPlan = {
  id: string;
  title: string;
  description: string | null;
  cities: string | null;
  startDate: string | null;
  endDate: string | null;
  _count: { pages: number };
};

type EditTravelPlanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  travelPlan: TravelPlan;
  onSuccess: (travelPlan: TravelPlan) => void;
};

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export function EditTravelPlanModal({ isOpen, onClose, travelPlan, onSuccess }: EditTravelPlanModalProps) {
  const [title, setTitle] = useState(travelPlan.title);
  const [description, setDescription] = useState(travelPlan.description || "");
  const [cities, setCities] = useState(travelPlan.cities || "");
  const [startDate, setStartDate] = useState(toInputDate(travelPlan.startDate));
  const [endDate, setEndDate] = useState(toInputDate(travelPlan.endDate));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setTitle(travelPlan.title);
      setDescription(travelPlan.description || "");
      setCities(travelPlan.cities || "");
      setStartDate(toInputDate(travelPlan.startDate));
      setEndDate(toInputDate(travelPlan.endDate));
      setError("");
    }
  }, [isOpen, travelPlan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Title is required"); return; }
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/travel-plans/${travelPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          cities: cities || null,
          startDate: startDate || null,
          endDate: endDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to update"); return; }
      onSuccess(json.data);
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Travel Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">{error}</div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cities</label>
          <input type="text" value={cities} onChange={(e) => setCities(e.target.value)}
            placeholder="e.g. Tokyo, Kyoto, Osaka"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isLoading}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50">
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
