import { AppHeader } from "@/app/components/AppHeader";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TravelPlansClient } from "./TravelPlansClient";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await getAuthUser();

  let travelPlans: any[] = [];
  let sharedItems: any[] = [];
  if (user) {
    [travelPlans, sharedItems] = await Promise.all([
      prisma.travelPlan.findMany({
        where: { userId: user.id },
        include: { _count: { select: { pages: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.sharedAccess.findMany({
        where: { userId: user.id, revoked: false },
        include: {
          shareLink: {
            include: { createdBy: { select: { name: true } } },
          },
        },
        orderBy: { accessedAt: "desc" },
      }),
    ]);
  }

  // For each shared access, fetch the full plan data for grid display
  const sharedWithMe = (
    await Promise.all(
      sharedItems
        .filter((a) => a.shareLink && a.shareLink.resourceType === "plan")
        .map(async (access) => {
          const { shareLink } = access;
          const plan = await prisma.travelPlan.findUnique({
            where: { id: shareLink.resourceId },
            include: { _count: { select: { pages: true } } },
          });
          if (!plan) return null;
          return {
            shareLinkId: shareLink.id,
            token: shareLink.token,
            permission: shareLink.permission as "view" | "edit",
            ownerName: shareLink.createdBy?.name ?? "Someone",
            id: plan.id,
            title: plan.title,
            description: plan.description,
            cities: plan.cities,
            startDate: plan.startDate ? plan.startDate.toISOString() : null,
            endDate: plan.endDate ? plan.endDate.toISOString() : null,
            createdAt: plan.createdAt.toISOString(),
            _count: plan._count,
          };
        })
    )
  ).filter(Boolean) as any[];

  const serialized = travelPlans.map((plan) => ({
    ...plan,
    startDate: plan.startDate ? plan.startDate.toISOString() : null,
    endDate: plan.endDate ? plan.endDate.toISOString() : null,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <TravelPlansClient initialTravelPlans={serialized} sharedWithMe={sharedWithMe} />
      </main>
    </div>
  );
}
