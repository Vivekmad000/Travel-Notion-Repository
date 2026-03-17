import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: outfitId } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const outfit = await prisma.outfit.findUnique({ where: { id: outfitId } });
  if (!outfit || outfit.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { clothingItemId } = await req.json();
  if (!clothingItemId) return NextResponse.json({ error: "clothingItemId required" }, { status: 400 });

  const item = await prisma.outfitItem.create({
    data: { outfitId, clothingItemId, x: 50, y: 50, zIndex: 0 },
    include: { clothingItem: true },
  });

  return NextResponse.json(item, { status: 201 });
}
