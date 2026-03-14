import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const username = req.nextUrl.searchParams.get("username")?.trim();
  if (!username) return NextResponse.json({ available: false });

  // Same username as current user is always "available"
  if (username === user.username) return NextResponse.json({ available: true });

  const taken = await prisma.user.findFirst({
    where: { username, id: { not: user.id } },
  });

  return NextResponse.json({ available: !taken });
}
