import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ pageId: string; plannerOutfitId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { pageId, plannerOutfitId } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const page = await prisma.page.findFirst({ where: { id: pageId, travelPlan: { userId: user.id } } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plannerOutfit = await prisma.plannerOutfit.findFirst({
    where: { id: plannerOutfitId, pageId },
  });
  if (!plannerOutfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete CalendarEntries referencing this PlannerOutfit (FK is NoAction)
  await prisma.calendarEntry.deleteMany({ where: { plannerOutfitId } });

  // Delete the PlannerOutfit
  await prisma.plannerOutfit.delete({ where: { id: plannerOutfitId } });

  // If the outfit is plannerOnly, check if any other PlannerOutfits still reference it
  const outfit = await prisma.outfit.findUnique({
    where: { id: plannerOutfit.outfitId },
    include: { items: { select: { id: true } } },
  });
  if (outfit?.plannerOnly) {
    const remaining = await prisma.plannerOutfit.count({ where: { outfitId: plannerOutfit.outfitId } });
    if (remaining === 0) {
      await prisma.outfitItem.deleteMany({ where: { outfitId: plannerOutfit.outfitId } });
      await prisma.outfit.delete({ where: { id: plannerOutfit.outfitId } });
    }
  }

  return NextResponse.json({ success: true });
}
