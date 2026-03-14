import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TravelSidebar } from "./TravelSidebar";
import { AppHeader } from "@/app/components/AppHeader";

export default async function TravelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await getAuthUser();
  if (!user) redirect("/");

  const travelPlan = await prisma.travelPlan.findFirst({
    where: { id, userId: user.id },
  });
  if (!travelPlan) redirect("/dashboard");

  const pages = await prisma.page.findMany({
    where: { travelPlanId: id },
    orderBy: { createdAt: "asc" },
  });

  const serializedPlan = {
    ...travelPlan,
    startDate: travelPlan.startDate ? travelPlan.startDate.toISOString() : null,
    endDate: travelPlan.endDate ? travelPlan.endDate.toISOString() : null,
    createdAt: travelPlan.createdAt.toISOString(),
    updatedAt: travelPlan.updatedAt.toISOString(),
  };

  const serializedPages = pages.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header — always visible */}
      <AppHeader />

      {/* Sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        <TravelSidebar
          travelPlanId={id}
          initialTravelPlan={serializedPlan}
          initialPages={serializedPages}
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
