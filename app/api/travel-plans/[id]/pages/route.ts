import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageNode = {
  id: string;
  title: string;
  depth: number;
  travelPlanId: string;
  parentPageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  children: PageNode[];
};

function buildTree(pages: Omit<PageNode, "children">[]): PageNode[] {
  const map = new Map<string, PageNode>();
  const roots: PageNode[] = [];

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] });
  }

  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parentPageId && map.has(page.parentPageId)) {
      map.get(page.parentPageId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const travelPlan = await prisma.travelPlan.findFirst({
      where: { id, userId: user.id },
    });
    if (!travelPlan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const pages = await prisma.page.findMany({
      where: { travelPlanId: id },
      orderBy: { createdAt: "asc" },
    });

    const tree = buildTree(pages);
    return NextResponse.json({ data: tree });
  } catch (error) {
    console.error("GET /api/travel-plans/[id]/pages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const travelPlan = await prisma.travelPlan.findFirst({
      where: { id, userId: user.id },
    });
    if (!travelPlan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { title, parentPageId, templateSlug } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let depth = 0;
    if (parentPageId) {
      const parentPage = await prisma.page.findFirst({
        where: { id: parentPageId, travelPlanId: id },
      });
      if (!parentPage) return NextResponse.json({ error: "Parent page not found" }, { status: 404 });
      if (parentPage.depth >= 4) {
        return NextResponse.json({ error: "Maximum page depth (4) exceeded" }, { status: 400 });
      }
      depth = parentPage.depth + 1;
    }

    const page = await prisma.page.create({
      data: {
        title: title.trim(),
        depth,
        travelPlanId: id,
        parentPageId: parentPageId || null,
        templateSlug: templateSlug || null,
      },
    });

    return NextResponse.json({ data: page }, { status: 201 });
  } catch (error) {
    console.error("POST /api/travel-plans/[id]/pages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
