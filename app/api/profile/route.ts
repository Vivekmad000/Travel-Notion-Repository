import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, username, bio, avatarUrl } = body;

  // Check username uniqueness if being changed
  if (username && username !== user.username) {
    const taken = await prisma.user.findFirst({
      where: { username, id: { not: user.id } },
    });
    if (taken) {
      return NextResponse.json(
        { error: "Username is already taken" },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name !== undefined && { name: name || null }),
      ...(username !== undefined && { username: username || null }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
    },
  });

  return NextResponse.json({
    name: updated.name,
    username: updated.username,
    bio: updated.bio,
    avatarUrl: updated.avatarUrl,
  });
}
