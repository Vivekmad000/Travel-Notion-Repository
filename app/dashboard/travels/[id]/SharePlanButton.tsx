"use client";

import { useState } from "react";
import { ShareModal } from "@/app/components/ShareModal";

type Props = {
  planId: string;
  planTitle: string;
};

export function SharePlanButton({ planId, planTitle }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg px-3 py-1.5 transition-colors"
      >
        🔗 Share
      </button>
      {open && (
        <ShareModal
          resourceType="plan"
          resourceId={planId}
          resourceTitle={planTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
