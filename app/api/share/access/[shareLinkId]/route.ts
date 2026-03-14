import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/share/access/[shareLinkId] — remove a shared item from the user's dashboard
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ shareLinkId: string }> }
) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shareLinkId } = await params;

  await prisma.sharedAccess.deleteMany({
    where: { userId: user.id, shareLinkId },
  });

  return NextResponse.json({ ok: true });
}
