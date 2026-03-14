import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function buildTree(pages: any[]): any[] {
  const map: Record<string, any> = {};
  const roots: any[] = [];
  for (const p of pages) map[p.id] = { ...p, children: [] };
  for (const p of pages) {
    if (p.parentPageId) map[p.parentPageId]?.children.push(map[p.id]);
    else roots.push(map[p.id]);
  }
  return roots;
}

// GET /api/share/[token] — resolve a share link (must be authenticated)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await params;

  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) return NextResponse.json({ error: "Link not found" }, { status: 404 });

  // Return the resource data based on type
  if (link.resourceType === "plan") {
    const plan = await prisma.travelPlan.findUnique({
      where: { id: link.resourceId },
      include: {
        pages: { orderBy: { createdAt: "asc" } },
        user: { select: { name: true, avatarUrl: true } },
      },
    });
    if (!plan) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    return NextResponse.json({
      permission: link.permission,
      resourceType: "plan",
      plan: {
        ...plan,
        pageTree: buildTree(plan.pages),
      },
    });
  } else {
    // Page share — include the page and all its descendants
    const rootPage = await prisma.page.findUnique({
      where: { id: link.resourceId },
      include: { travelPlan: { select: { title: true } } },
    });
    if (!rootPage) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    // Fetch all pages in the same plan, filter to root + descendants
    const allPages = await prisma.page.findMany({
      where: { travelPlanId: rootPage.travelPlanId },
      orderBy: { createdAt: "asc" },
    });

    // Walk the tree to get only the shared page's subtree
    function getSubtreeIds(pages: any[], rootId: string): Set<string> {
      const ids = new Set<string>([rootId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const p of pages) {
          if (p.parentPageId && ids.has(p.parentPageId) && !ids.has(p.id)) {
            ids.add(p.id);
            changed = true;
          }
        }
      }
      return ids;
    }

    const subtreeIds = getSubtreeIds(allPages, rootPage.id);
    const subtreePages = allPages.filter((p) => subtreeIds.has(p.id));

    return NextResponse.json({
      permission: link.permission,
      resourceType: "page",
      planTitle: rootPage.travelPlan.title,
      rootPageId: rootPage.id,
      pageTree: buildTree(subtreePages),
    });
  }
}
