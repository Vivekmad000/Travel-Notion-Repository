import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { content, title } = body;

    // Check ownership OR shared-edit access
    const page = await prisma.page.findUnique({
      where: { id },
      select: { id: true, travelPlanId: true, travelPlan: { select: { userId: true } } },
    });
    if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const isOwner = page.travelPlan.userId === user.id;

    if (!isOwner) {
      // Check for active shared-edit access on this plan
      const sharedAccess = await prisma.sharedAccess.findFirst({
        where: {
          userId: user.id,
          revoked: false,
          shareLink: {
            resourceType: "plan",
            resourceId: page.travelPlanId,
            permission: "edit",
          },
        },
      });
      if (!sharedAccess) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.page.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(title !== undefined && { title: title.trim() }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/pages/[id]/content error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
