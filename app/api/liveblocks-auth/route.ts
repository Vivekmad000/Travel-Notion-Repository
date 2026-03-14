import { auth } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import { prisma } from "@/lib/prisma";
import { colorForUser } from "@/lib/userColor";
import { NextResponse } from "next/server";

const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY! });

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The client sends { room: "page-<pageId>" }
  const { room } = await req.json();
  if (!room || typeof room !== "string") {
    return NextResponse.json({ error: "Missing room" }, { status: 400 });
  }

  // Validate: the room must reference a real page, and the user must have access
  const pageId = room.replace("page-", "");

  // Look up the page + its plan's owner
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: { travelPlan: { select: { userId: true } } },
  });

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  // Look up the DB user record (need their DB id for ownership check)
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, name: true, username: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const displayName = user.name || user.username || "Anonymous";
  const color = colorForUser(userId);

  // Determine if this user is allowed in the room
  // travelPlan.userId is the DB User id (not Clerk id)
  const isOwner = page.travelPlan.userId === user.id;
  let hasEditAccess = isOwner;

  if (!isOwner) {
    // Check for a valid "edit" ShareLink for this plan + an active SharedAccess
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
    hasEditAccess = !!sharedAccess;
  }

  if (!hasEditAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prepare and authorize the Liveblocks session
  const session = liveblocks.prepareSession(userId, {
    userInfo: { name: displayName, color },
  });

  session.allow(room, session.FULL_ACCESS);

  const { status, body } = await session.authorize();
  return new Response(body, { status });
}
