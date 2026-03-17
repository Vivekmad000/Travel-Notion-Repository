import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [folders, outfits] = await Promise.all([
    prisma.outfitFolder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.outfit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { clothingItem: { select: { imageUrl: true } } },
          orderBy: { zIndex: "asc" },
        },
      },
    }),
  ]);

  return NextResponse.json({ folders, outfits });
}

export async function POST(req: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { name, folderId } = await req.json();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const outfit = await prisma.outfit.create({
    data: { name, folderId: folderId ?? null, userId: user.id },
    include: { items: { include: { clothingItem: { select: { imageUrl: true } } } } },
  });

  return NextResponse.json(outfit, { status: 201 });
}
