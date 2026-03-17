import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getAuthedItem(clerkId: string, outfitId: string, itemId: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  const outfit = await prisma.outfit.findUnique({ where: { id: outfitId } });
  if (!outfit || outfit.userId !== user.id) return null;
  const item = await prisma.outfitItem.findUnique({ where: { id: itemId } });
  if (!item || item.outfitId !== outfitId) return null;
  return item;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: outfitId, itemId } = await params;
  const item = await getAuthedItem(clerkId, outfitId, itemId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { x, y, zIndex } = await req.json();
  const updated = await prisma.outfitItem.update({
    where: { id: itemId },
    data: {
      ...(x !== undefined ? { x } : {}),
      ...(y !== undefined ? { y } : {}),
      ...(zIndex !== undefined ? { zIndex } : {}),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: outfitId, itemId } = await params;
  const item = await getAuthedItem(clerkId, outfitId, itemId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.outfitItem.delete({ where: { id: itemId } });
  return NextResponse.json({ success: true });
}
