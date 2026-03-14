import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";

// One shared Liveblocks client — points to our auth endpoint
const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
});

// Presence: what each user broadcasts to others in real-time
export type Presence = {
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
};

// UserMeta: static info stored per user (from our auth endpoint)
export type UserMeta = {
  id: string;
  info: {
    name: string;
    color: string;
  };
};

export const {
  RoomProvider,
  useRoom,
  useOthers,
  useSelf,
  useUpdateMyPresence,
} = createRoomContext<Presence, {}, UserMeta>(client);
