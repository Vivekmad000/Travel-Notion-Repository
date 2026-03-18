import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { pageId } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const page = await prisma.page.findFirst({ where: { id: pageId, travelPlan: { userId: user.id } } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const plannerOutfits = await prisma.plannerOutfit.findMany({
    where: { pageId },
    orderBy: { createdAt: "asc" },
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
  });
  return NextResponse.json({ plannerOutfits });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { pageId } = await params;
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const page = await prisma.page.findFirst({ where: { id: pageId, travelPlan: { userId: user.id } } });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { outfitId } = await req.json();
  if (!outfitId) return NextResponse.json({ error: "outfitId required" }, { status: 400 });
  const outfit = await prisma.outfit.findFirst({ where: { id: outfitId, userId: user.id } });
  if (!outfit) return NextResponse.json({ error: "Outfit not found" }, { status: 404 });
  const plannerOutfit = await prisma.plannerOutfit.upsert({
    where: { pageId_outfitId: { pageId, outfitId } },
    update: {},
    create: { pageId, outfitId },
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
  });
  return NextResponse.json({ plannerOutfit }, { status: 201 });
}
