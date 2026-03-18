import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getAuthedOutfit(clerkId: string, id: string) {
  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return null;
  const outfit = await prisma.outfit.findUnique({ where: { id } });
  if (!outfit || outfit.userId !== user.id) return null;
  return outfit;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const outfit = await getAuthedOutfit(clerkId, id);
  if (!outfit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { folderId } = await req.json();
  const updated = await prisma.outfit.update({
    where: { id },
    data: {
      plannerOnly: false,
      folderId: folderId ?? null,
    },
  });

  return NextResponse.json(updated);
}
