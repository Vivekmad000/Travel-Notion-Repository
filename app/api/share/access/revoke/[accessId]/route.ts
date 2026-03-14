import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/share/access/revoke/[accessId] — owner removes a user's access
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ accessId: string }> }
) {
  const { accessId } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await prisma.sharedAccess.findUnique({
    where: { id: accessId },
    include: { shareLink: { select: { resourceType: true, resourceId: true } } },
  });
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const plan = await prisma.travelPlan.findFirst({
    where: { id: access.shareLink.resourceId, userId: user.id },
    select: { id: true },
  });
  if (!plan) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.sharedAccess.update({ where: { id: accessId }, data: { revoked: true } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/share/access/revoke/[accessId] — owner changes a user's permission
// Moves the SharedAccess to the correct ShareLink for the new permission.
// Finds or creates that link so user2 never ends up with two dashboard entries.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ accessId: string }> }
) {
  const { accessId } = await params;
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { permission } = await req.json();
  if (!["view", "edit"].includes(permission)) {
    return NextResponse.json({ error: "Invalid permission" }, { status: 400 });
  }

  const access = await prisma.sharedAccess.findUnique({
    where: { id: accessId },
    include: { shareLink: { select: { resourceType: true, resourceId: true, permission: true } } },
  });
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify ownership
  const plan = await prisma.travelPlan.findFirst({
    where: { id: access.shareLink.resourceId, userId: user.id },
    select: { id: true },
  });
  if (!plan) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // No-op if permission is already correct
  if (access.shareLink.permission === permission) {
    return NextResponse.json({ ok: true, permission });
  }

  // Find or create a ShareLink for the new permission
  let targetLink = await prisma.shareLink.findFirst({
    where: {
      resourceType: "plan",
      resourceId: access.shareLink.resourceId,
      permission,
      createdByUserId: user.id,
    },
  });
  if (!targetLink) {
    targetLink = await prisma.shareLink.create({
      data: {
        resourceType: "plan",
        resourceId: access.shareLink.resourceId,
        permission,
        createdByUserId: user.id,
      },
    });
  }

  // Revoke the current access record, then upsert on the target link.
  // This avoids unique constraint conflicts if a (userId, targetLinkId) record already exists.
  await prisma.sharedAccess.update({
    where: { id: accessId },
    data: { revoked: true },
  });

  await prisma.sharedAccess.upsert({
    where: { userId_shareLinkId: { userId: access.userId, shareLinkId: targetLink.id } },
    create: { userId: access.userId, shareLinkId: targetLink.id, revoked: false },
    update: { revoked: false, accessedAt: new Date() },
  });

  return NextResponse.json({ ok: true, permission });
}
