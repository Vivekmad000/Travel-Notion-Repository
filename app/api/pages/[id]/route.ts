import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getPageForUser(pageId: string, userId: string) {
  return prisma.page.findFirst({
    where: {
      id: pageId,
      travelPlan: { userId },
    },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const page = await prisma.page.findFirst({
      where: { id, travelPlan: { userId: user.id } },
      include: { children: true },
    });

    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: page });
  } catch (error) {
    console.error("GET /api/pages/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const existing = await getPageForUser(id, user.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { title } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updated = await prisma.page.update({
      where: { id },
      data: { title: title.trim() },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/pages/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function deletePageRecursive(pageId: string): Promise<void> {
  const children = await prisma.page.findMany({ where: { parentPageId: pageId } });
  for (const child of children) {
    await deletePageRecursive(child.id);
  }
  await prisma.page.delete({ where: { id: pageId } });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await getPageForUser(id, user.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await deletePageRecursive(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/pages/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
