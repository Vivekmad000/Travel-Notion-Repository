import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const travelPlans = await prisma.travelPlan.findMany({
      where: { userId: user.id },
      include: { _count: { select: { pages: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: travelPlans });
  } catch (error) {
    console.error("GET /api/travel-plans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, cities, startDate, endDate } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const travelPlan = await prisma.travelPlan.create({
      data: {
        title: title.trim(),
        description: description || null,
        cities: cities || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: user.id,
      },
      include: { _count: { select: { pages: true } } },
    });

    return NextResponse.json({ data: travelPlan }, { status: 201 });
  } catch (error) {
    console.error("POST /api/travel-plans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
