import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { EditTravelPlanButton } from "./EditTravelPlanButton";

function formatDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default async function TravelPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await getAuthUser();
  if (!user) redirect("/sign-in");

  const travelPlan = await prisma.travelPlan.findFirst({
    where: { id, userId: user.id },
    include: { _count: { select: { pages: true } } },
  });

  if (!travelPlan) redirect("/dashboard");

  const cities = travelPlan.cities
    ? travelPlan.cities.split(",").map((c) => c.trim()).filter(Boolean)
    : [];
  const startDate = formatDate(travelPlan.startDate);
  const endDate = formatDate(travelPlan.endDate);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: travelPlan.title },
          ]}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{travelPlan.title}</h1>
          <EditTravelPlanButton travelPlan={{
            ...travelPlan,
            startDate: travelPlan.startDate ? travelPlan.startDate.toISOString() : null,
            endDate: travelPlan.endDate ? travelPlan.endDate.toISOString() : null,
          }} />
        </div>

        {travelPlan.description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{travelPlan.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {(startDate || endDate) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dates</div>
              <div className="text-gray-900">
                {startDate && endDate
                  ? `${startDate} → ${endDate}`
                  : startDate || endDate}
              </div>
            </div>
          )}
          {cities.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Cities</div>
              <div className="flex flex-wrap gap-1.5">
                {cities.map((city) => (
                  <span key={city} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full font-medium">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              📄 <span>{travelPlan._count.pages} page{travelPlan._count.pages !== 1 ? "s" : ""}</span>
            </span>
            <span>·</span>
            <span>Created {new Date(travelPlan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-xl p-6 text-center">
        <p className="text-indigo-700 font-medium mb-1">👈 Select a page from the sidebar</p>
        <p className="text-indigo-500 text-sm">or create a new one to start organizing your trip notes</p>
      </div>
    </div>
  );
}
