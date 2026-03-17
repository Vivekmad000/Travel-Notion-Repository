import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "REMOVE_BG_API_KEY not configured" }, { status: 500 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  // Forward to remove.bg
  const body = new FormData();
  body.append("image_file", file);
  body.append("size", "auto");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `remove.bg error: ${err}` }, { status: res.status });
  }

  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return NextResponse.json({ imageData: `data:image/png;base64,${base64}` });
}
