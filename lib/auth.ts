import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

const ADJECTIVES = [
  "swift", "bold", "bright", "calm", "daring", "eager", "epic", "fancy",
  "glad", "grand", "jolly", "keen", "lively", "lucky", "merry", "noble",
  "proud", "quick", "ready", "sharp", "sleek", "smart", "snappy", "sunny",
  "witty", "zesty",
];
const NOUNS = [
  "atlas", "compass", "drifter", "explorer", "flyer", "globe", "guide",
  "nomad", "pathfinder", "pioneer", "rambler", "ranger", "roamer", "sailor",
  "scout", "traveler", "trekker", "voyager", "wanderer", "wayfarer",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCandidateUsername(name: string | null): string {
  const base = name
    ? name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)
    : null;
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  if (base && base.length >= 3) return `${base}${suffix}`;
  return `${randomItem(ADJECTIVES)}_${randomItem(NOUNS)}${suffix}`;
}

export async function generateUniqueUsername(name: string | null): Promise<string> {
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = generateCandidateUsername(name);
    const taken = await prisma.user.findUnique({ where: { username: candidate } });
    if (!taken) return candidate;
  }
  // Fallback: pure random
  return `traveler_${Date.now().toString(36)}`;
}

export async function getAuthUser() {
  const { userId } = await auth();
  if (!userId) return null;

  // Try to find the user first (fast path)
  const existing = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (existing) return existing;

  // User is signed in with Clerk but not in DB yet (webhook hasn't fired in dev).
  // Auto-create them now.
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null;
  const username = await generateUniqueUsername(name);

  return prisma.user.create({
    data: {
      clerkId: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
      name,
      username,
    },
  });
}
