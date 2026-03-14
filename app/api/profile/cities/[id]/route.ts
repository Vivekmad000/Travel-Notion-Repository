import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify ownership before deleting
  const city = await prisma.visitedCity.findFirst({
    where: { id, userId: user.id },
  });
  if (!city) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.visitedCity.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
