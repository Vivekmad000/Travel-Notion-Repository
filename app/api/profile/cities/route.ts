import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: list all visited cities for the current user
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cities = await prisma.visitedCity.findMany({
    where: { userId: user.id },
    orderBy: { cityName: "asc" },
  });

  return NextResponse.json(cities);
}

// POST: add a new visited city
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cityName, country, lat, lng } = await req.json();
  if (!cityName || !country || lat == null || lng == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Prevent duplicates (same city name for same user)
  const existing = await prisma.visitedCity.findFirst({
    where: { userId: user.id, cityName: { equals: cityName } },
  });
  if (existing) {
    return NextResponse.json(existing); // Return existing — not an error
  }

  const city = await prisma.visitedCity.create({
    data: { cityName, country, lat, lng, userId: user.id },
  });

  return NextResponse.json(city, { status: 201 });
}
