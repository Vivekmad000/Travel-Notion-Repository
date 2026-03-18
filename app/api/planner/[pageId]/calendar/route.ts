import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getAuthedPage(clerkId: string, pageId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  const page = await prisma.page.findFirst({
    where: { id: pageId, travelPlan: { userId: user.id } },
  });
  return page ? { page, user } : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { pageId } = await params;
  const authed = await getAuthedPage(clerkId, pageId);
  if (!authed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.calendarEntry.findMany({
    where: { pageId },
    orderBy: [{ date: "asc" }, { order: "asc" }],
    include: {
      plannerOutfit: {
        include: {
          outfit: {
            include: {
              items: {
                include: { clothingItem: { select: { id: true, imageUrl: true } } },
                orderBy: { zIndex: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ entries });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { pageId } = await params;
  const authed = await getAuthedPage(clerkId, pageId);
  if (!authed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { plannerOutfitId, date } = await req.json();
  if (!plannerOutfitId || !date) {
    return NextResponse.json({ error: "plannerOutfitId and date are required" }, { status: 400 });
  }

  // Verify plannerOutfit belongs to this page
  const plannerOutfit = await prisma.plannerOutfit.findFirst({
    where: { id: plannerOutfitId, pageId },
  });
  if (!plannerOutfit) return NextResponse.json({ error: "Planner outfit not found" }, { status: 404 });

  // Find next order value for this date
  const existing = await prisma.calendarEntry.findMany({ where: { pageId, date } });
  const order = existing.length;

  const entry = await prisma.calendarEntry.create({
    data: { pageId, plannerOutfitId, date, order },
    include: {
      plannerOutfit: {
        include: {
          outfit: {
            include: {
              items: {
                include: { clothingItem: { select: { id: true, imageUrl: true } } },
                orderBy: { zIndex: "asc" },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}
