import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  const body = await req.json();
  const evt: WebhookEvent = body;

  switch (evt.type) {
    case "user.created":
      await prisma.user.create({
        data: {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address || "",
          name: `${evt.data.first_name || ""} ${evt.data.last_name || ""}`.trim(),
        },
      });
      break;

    case "user.updated":
      await prisma.user.update({
        where: { clerkId: evt.data.id },
        data: {
          email: evt.data.email_addresses[0]?.email_address || "",
          name: `${evt.data.first_name || ""} ${evt.data.last_name || ""}`.trim(),
        },
      });
      break;

    case "user.deleted":
      if (evt.data.id) {
        await prisma.user.delete({
          where: { clerkId: evt.data.id },
        });
      }
      break;
  }

  return new Response("", { status: 201 });
}
