import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/share?planId=xxx — returns existing share links + who has access (owner only)
export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const planId = searchParams.get("planId");
  if (!planId) return NextResponse.json({ error: "Missing planId" }, { status: 400 });

  // Verify ownership
  const plan = await prisma.travelPlan.findFirst({ where: { id: planId, userId: user.id } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Fetch all share links for this plan with their accesses + user info
  const links = await prisma.shareLink.findMany({
    where: { resourceType: "plan", resourceId: planId, createdByUserId: user.id },
    include: {
      accesses: {
        where: { revoked: false },
        include: {
          user: { select: { id: true, name: true, username: true, email: true, avatarUrl: true } },
        },
        orderBy: { accessedAt: "desc" },
      },
    },
  });

  return NextResponse.json({ links });
}

// POST /api/share — create or retrieve an existing share link
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { resourceType, resourceId, permission } = await req.json();

  if (resourceType !== "plan")
    return NextResponse.json({ error: "Only travel plans can be shared" }, { status: 400 });
  if (!["view", "edit"].includes(permission))
    return NextResponse.json({ error: "Invalid permission" }, { status: 400 });

  // Verify the user owns the plan
  const plan = await prisma.travelPlan.findFirst({
    where: { id: resourceId, userId: user.id },
  });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Upsert: one link per resource+permission combo per user
  const existing = await prisma.shareLink.findFirst({
    where: { resourceType, resourceId, permission, createdByUserId: user.id },
  });

  if (existing) {
    return NextResponse.json({ token: existing.token });
  }

  const link = await prisma.shareLink.create({
    data: { resourceType, resourceId, permission, createdByUserId: user.id },
  });

  return NextResponse.json({ token: link.token });
}
