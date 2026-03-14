'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditTravelPlanModal } from "@/app/dashboard/components/EditTravelPlanModal";

type TravelPlan = {
  id: string;
  title: string;
  description: string | null;
  cities: string | null;
  startDate: string | null;
  endDate: string | null;
  _count: { pages: number };
};

export function EditTravelPlanButton({ travelPlan }: { travelPlan: TravelPlan }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsOpen(false);
    router.refresh(); // re-fetches the server component with updated data
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-3 py-1.5 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        Edit
      </button>
      <EditTravelPlanModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        travelPlan={travelPlan}
        onSuccess={handleSuccess}
      />
    </>
  );
}
