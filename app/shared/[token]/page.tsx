import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { colorForUser } from "@/lib/userColor";
import { SharedView } from "./SharedView";
import { SharedSignInPrompt } from "./SharedSignInPrompt";

async function getPlanIdForPage(pageId: string): Promise<string> {
  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { travelPlanId: true } });
  return page?.travelPlanId ?? "";
}

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

export default async function SharedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { userId } = await auth();

  // Not signed in — show a friendly prompt instead of redirecting
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✈️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view</h1>
          <p className="text-sm text-gray-500 mb-6">
            You need a TravelVerse account to view this shared content.
          </p>
          <SharedSignInPrompt token={token} />
        </div>
      </div>
    );
  }

  // Ensure our DB user record exists (auto-upsert for new Clerk users)
  const currentUser = await getAuthUser();

  const link = await prisma.shareLink.findUnique({ where: { token } });
  if (!link) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500">
        This share link is invalid or has been removed.
      </div>
    );
  }

  // If the owner visits their own share link, redirect them to the real resource
  if (currentUser && link.createdByUserId === currentUser.id) {
    const destination =
      link.resourceType === "plan"
        ? `/dashboard/travels/${link.resourceId}`
        : `/dashboard/travels/${await getPlanIdForPage(link.resourceId)}/pages/${link.resourceId}`;
    redirect(destination);
  }

  // Auto-record that this user has accessed this shared link (upsert),
  // but ONLY if they haven't been revoked. If revoked:
  //   - Check if they have active access via a DIFFERENT link for the same resource (permission change).
  //     If so, redirect seamlessly to that new token.
  //   - Otherwise their access was fully removed — redirect to dashboard.
  if (currentUser) {
    const existing = await prisma.sharedAccess.findUnique({
      where: { userId_shareLinkId: { userId: currentUser.id, shareLinkId: link.id } },
    });
    if (existing?.revoked) {
      // Look for another active link for this same resource
      const activeAccess = await prisma.sharedAccess.findFirst({
        where: {
          userId: currentUser.id,
          revoked: false,
          shareLink: { resourceType: link.resourceType, resourceId: link.resourceId },
        },
        include: { shareLink: { select: { token: true } } },
      });
      if (activeAccess) {
        redirect(`/shared/${activeAccess.shareLink.token}`);
      }
      redirect("/dashboard");
    }
    await prisma.sharedAccess.upsert({
      where: { userId_shareLinkId: { userId: currentUser.id, shareLinkId: link.id } },
      create: { userId: currentUser.id, shareLinkId: link.id },
      update: { accessedAt: new Date() },
    });
  }

  if (link.resourceType === "plan") {
    const plan = await prisma.travelPlan.findUnique({
      where: { id: link.resourceId },
      include: {
        pages: { orderBy: { createdAt: "asc" } },
        user: { select: { name: true, avatarUrl: true } },
      },
    });
    if (!plan) {
      return (
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          This travel plan no longer exists.
        </div>
      );
    }

    const userName = currentUser?.name || currentUser?.username || "Anonymous";
    const userColor = colorForUser(userId);

    return (
      <SharedView
        permission={link.permission as "view" | "edit"}
        resourceType="plan"
        planTitle={plan.title}
        planDescription={plan.description}
        ownerName={plan.user.name}
        pageTree={buildTree(plan.pages)}
        allPages={plan.pages}
        userName={userName}
        userColor={userColor}
      />
    );
  } else {
    const rootPage = await prisma.page.findUnique({
      where: { id: link.resourceId },
      include: { travelPlan: { include: { user: { select: { name: true } } } } },
    });
    if (!rootPage) {
      return (
        <div className="flex items-center justify-center min-h-screen text-gray-500">
          This page no longer exists.
        </div>
      );
    }

    const allPages = await prisma.page.findMany({
      where: { travelPlanId: rootPage.travelPlanId },
      orderBy: { createdAt: "asc" },
    });

    function getSubtreeIds(pages: any[], rootId: string): Set<string> {
      const ids = new Set<string>([rootId]);
      let changed = true;
      while (changed) {
        changed = false;
        for (const p of pages) {
          if (p.parentPageId && ids.has(p.parentPageId) && !ids.has(p.id)) {
            ids.add(p.id); changed = true;
          }
        }
      }
      return ids;
    }

    const subtreeIds = getSubtreeIds(allPages, rootPage.id);
    const subtreePages = allPages.filter((p) => subtreeIds.has(p.id));

    const userName = currentUser?.name || currentUser?.username || "Anonymous";
    const userColor = colorForUser(userId);

    return (
      <SharedView
        permission={link.permission as "view" | "edit"}
        resourceType="page"
        planTitle={rootPage.travelPlan.title}
        ownerName={rootPage.travelPlan.user.name}
        pageTree={buildTree(subtreePages)}
        allPages={subtreePages}
        rootPageId={rootPage.id}
        userName={userName}
        userColor={userColor}
      />
    );
  }
}
