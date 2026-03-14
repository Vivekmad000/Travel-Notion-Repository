import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthUser, generateUniqueUsername } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [dbUser, clerkUser] = await Promise.all([
    getAuthUser(),
    currentUser(),
  ]);

  if (!dbUser || !clerkUser) redirect("/sign-in");

  // Back-fill username for existing users who don't have one yet
  let user = dbUser;
  if (!user.username) {
    const username = await generateUniqueUsername(user.name);
    user = await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
  }

  // Count visited cities already in DB
  const visitedCities = await prisma.visitedCity.findMany({
    where: { userId: user.id },
    orderBy: { cityName: "asc" },
  });

  return (
    <ProfileClient
      user={{
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        memberSince: user.createdAt.toISOString(),
        // Clerk profile image as fallback if no custom avatar
        clerkImageUrl: clerkUser.imageUrl,
      }}
      initialVisitedCities={visitedCities.map((c) => ({
        id: c.id,
        cityName: c.cityName,
        country: c.country,
        lat: c.lat,
        lng: c.lng,
      }))}
    />
  );
}
