import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const folder = await prisma.outfitFolder.findUnique({ where: { id } });
  if (!folder || folder.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "name required" }, { status: 400 });

  const updated = await prisma.outfitFolder.update({ where: { id }, data: { name: name.trim() } });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkId } = await auth();
  if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const folder = await prisma.outfitFolder.findUnique({ where: { id } });
  if (!folder || folder.userId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Unlink outfits from this folder before deleting (NoAction constraint)
  await prisma.outfit.updateMany({ where: { folderId: id }, data: { folderId: null } });
  await prisma.outfitFolder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
