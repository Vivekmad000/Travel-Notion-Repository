import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Nominatim geocode: returns { lat, lng, country } or null
async function geocodeCity(
  cityName: string
): Promise<{ lat: number; lng: number; country: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1&addressdetails=1&accept-language=en`;
    const res = await fetch(url, {
      headers: { "User-Agent": "TravelNotion/1.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    const { lat, lon, address } = data[0];
    const country =
      address?.country || address?.state || cityName;
    return { lat: parseFloat(lat), lng: parseFloat(lon), country };
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Trip count
  const tripCount = await prisma.travelPlan.count({
    where: { userId: user.id },
  });

  // Auto-seed VisitedCity from travel plans' cities field (skips duplicates)
  const plans = await prisma.travelPlan.findMany({
    where: { userId: user.id, cities: { not: null } },
    select: { cities: true },
  });

  const existingCities = await prisma.visitedCity.findMany({
    where: { userId: user.id },
    select: { cityName: true },
  });
  const existingNames = new Set(
    existingCities.map((c) => c.cityName.toLowerCase())
  );

  // Parse city names from all travel plans (comma-separated)
  const rawCityNames = plans
    .flatMap((p) =>
      (p.cities ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
    .filter((name) => !existingNames.has(name.toLowerCase()));

  const uniqueNew = [...new Set(rawCityNames.map((n) => n.toLowerCase()))];

  // Geocode and insert new cities (best-effort, fire-and-forget errors)
  for (const cityLower of uniqueNew) {
    // Use original casing from rawCityNames
    const cityName =
      rawCityNames.find((n) => n.toLowerCase() === cityLower) ?? cityLower;
    const geo = await geocodeCity(cityName);
    if (geo) {
      await prisma.visitedCity.create({
        data: {
          cityName,
          country: geo.country,
          lat: geo.lat,
          lng: geo.lng,
          userId: user.id,
        },
      }).catch(() => {}); // ignore duplicate races
    }
  }

  // Final counts after seeding
  const [cityCount, countryRows] = await Promise.all([
    prisma.visitedCity.count({ where: { userId: user.id } }),
    prisma.visitedCity.findMany({
      where: { userId: user.id },
      select: { country: true },
      distinct: ["country"],
    }),
  ]);

  return NextResponse.json({
    trips: tripCount,
    cities: cityCount,
    countries: countryRows.length,
  });
}
