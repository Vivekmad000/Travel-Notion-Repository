import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getMaxDepthInSubtree(pageId: string): Promise<number> {
  const children = await prisma.page.findMany({ where: { parentPageId: pageId } });
  if (children.length === 0) return 0;
  const childDepths = await Promise.all(children.map((c) => getMaxDepthInSubtree(c.id)));
  return 1 + Math.max(...childDepths);
}

async function updateDescendantDepths(pageId: string, newDepth: number): Promise<void> {
  await prisma.page.update({ where: { id: pageId }, data: { depth: newDepth } });
  const children = await prisma.page.findMany({ where: { parentPageId: pageId } });
  for (const child of children) {
    await updateDescendantDepths(child.id, newDepth + 1);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const page = await prisma.page.findFirst({
      where: { id, travelPlan: { userId: user.id } },
    });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { newParentPageId } = body;

    let newDepth = 0;
    if (newParentPageId) {
      const newParent = await prisma.page.findFirst({
        where: { id: newParentPageId, travelPlan: { userId: user.id } },
      });
      if (!newParent) return NextResponse.json({ error: "New parent not found" }, { status: 404 });

      const subtreeDepth = await getMaxDepthInSubtree(id);
      const totalDepth = newParent.depth + 1 + subtreeDepth;
      if (totalDepth > 4) {
        return NextResponse.json({ error: "Move would exceed maximum depth (4)" }, { status: 400 });
      }
      newDepth = newParent.depth + 1;
    }

    await prisma.page.update({
      where: { id },
      data: { parentPageId: newParentPageId || null },
    });
    await updateDescendantDepths(id, newDepth);

    const updated = await prisma.page.findUnique({ where: { id } });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/pages/[id]/move error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
