import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTravelPlanForUser(planId: string, userId: string) {
  return prisma.travelPlan.findFirst({
    where: { id: planId, userId },
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

    const travelPlan = await prisma.travelPlan.findFirst({
      where: { id, userId: user.id },
      include: { _count: { select: { pages: true } } },
    });

    if (!travelPlan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: travelPlan });
  } catch (error) {
    console.error("GET /api/travel-plans/[id] error:", error);
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

    const existing = await getTravelPlanForUser(id, user.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { title, description, cities, startDate, endDate } = body;

    const updated = await prisma.travelPlan.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(cities !== undefined && { cities: cities || null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
      include: { _count: { select: { pages: true } } },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("PUT /api/travel-plans/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await getTravelPlanForUser(id, user.id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.travelPlan.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/travel-plans/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
