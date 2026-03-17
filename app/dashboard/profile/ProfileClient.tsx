"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AppHeader } from "@/app/components/AppHeader";
import { formatMonthYearLong } from "@/lib/dateFormat";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

const { uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: "/api/uploadthing",
});

// Leaflet is SSR-unsafe — load only on client
const TravelMap = dynamic(() => import("./TravelMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[580px] flex items-center justify-center text-gray-400 text-sm">
      Loading map…
    </div>
  ),
});

export type VisitedCityData = {
  id: string;
  cityName: string;
  country: string;
  lat: number;
  lng: number;
};

type ProfileUser = {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  memberSince: string;
  clerkImageUrl: string;
};

type Props = {
  user: ProfileUser;
  initialVisitedCities: VisitedCityData[];
};

export function ProfileClient({ user, initialVisitedCities }: Props) {
  const [visitedCities, setVisitedCities] =
    useState<VisitedCityData[]>(initialVisitedCities);
  const [tripCount, setTripCount] = useState<number | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user.name ?? "");
  const [editUsername, setEditUsername] = useState(user.username ?? "");
  const [editBio, setEditBio] = useState(user.bio ?? "");
  const [avatarSrc, setAvatarSrc] = useState(
    user.avatarUrl || user.clerkImageUrl
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Username availability check
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUsernameChange = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9_]/g, "");
    setEditUsername(clean);
    setUsernameStatus("idle");
    if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    if (!clean || clean === user.username) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    usernameCheckTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/profile/check-username?username=${encodeURIComponent(clean)}`
        );
        const data = await res.json();
        setUsernameStatus(data.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 500);
  };

  // Display state (reflects saved values)
  const [displayName, setDisplayName] = useState(user.name);
  const [displayUsername, setDisplayUsername] = useState(user.username);
  const [displayBio, setDisplayBio] = useState(user.bio);

  // Fetch stats (also triggers auto-seed of VisitedCity from travel plans)
  useEffect(() => {
    fetch("/api/profile/stats")
      .then((r) => r.json())
      .then((data) => {
        setTripCount(data.trips ?? null);
        if (data.cities > visitedCities.length) {
          window.location.reload();
        }
      })
      .catch(() => {});
  }, []);

  const memberSince = formatMonthYearLong(user.memberSince);

  const uniqueCountries = [...new Set(visitedCities.map((c) => c.country))];

  const handleAvatarClick = () => {
    if (editing) avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const [res] = await uploadFiles("avatarUploader", { files: [file] });
      setAvatarSrc(res.url);
    } catch {
      setSaveError("Avatar upload failed. Try again.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          username: editUsername,
          bio: editBio,
          avatarUrl: avatarSrc === user.clerkImageUrl ? null : avatarSrc,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Failed to save. Try again.");
        return;
      }      const updated = await res.json();
      setDisplayName(updated.name);
      setDisplayUsername(updated.username);
      setDisplayBio(updated.bio);
      setEditing(false);
    } catch {
      setSaveError("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditName(displayName ?? "");
    setEditUsername(displayUsername ?? "");
    setEditBio(displayBio ?? "");
    setAvatarSrc(user.avatarUrl || user.clerkImageUrl);
    setSaveError(null);
    setUsernameStatus("idle");
    setEditing(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--tv-cream)" }}>
      <AppHeader />

      {/* Background sketch — bottom left, behind content */}
      <div className="pointer-events-none select-none fixed bottom-0 left-0 z-0" style={{ opacity: 0.5, width: "25vw" }}>
        <Image src="/assets/vacay_seats.png" alt="" width={832} height={760} style={{ width: "100%", height: "auto", display: "block" }} />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-6 items-start">

          {/* ── Left column 35% ── */}
          <div className="shrink-0 space-y-4" style={{ width: "35%" }}>

            {/* Profile Card — orange */}
            <div className="rounded-2xl p-6 overflow-hidden" style={{ backgroundColor: "var(--tv-terracotta)", boxShadow: "0 1px 6px rgba(229,101,45,0.2)" }}>
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={avatarSrc}
                    alt={displayName || "Profile"}
                    onClick={handleAvatarClick}
                    className={`w-20 h-20 rounded-full object-cover shadow-md transition ${
                      editing ? "cursor-pointer hover:opacity-80" : ""
                    }`}
                    style={{ border: `3px solid rgba(240,236,224,0.4)` }}
                  />
                  {editing && (
                    <div onClick={handleAvatarClick} className="absolute inset-0 flex items-center justify-center rounded-full cursor-pointer" style={{ backgroundColor: "rgba(0,0,0,0.3)" }}>
                      <span className="text-white text-xs font-medium">{uploadingAvatar ? "Uploading…" : "Change"}</span>
                    </div>
                  )}
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                {/* Info / Edit form */}
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(240,236,224,0.8)", fontFamily: "var(--font-fredoka)" }}>Name</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Your name"
                          className="mt-1 block w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                          style={{ border: "1px solid rgba(240,236,224,0.4)", color: "var(--tv-navy)", backgroundColor: "rgba(255,255,255,0.9)" }}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(240,236,224,0.8)", fontFamily: "var(--font-fredoka)" }}>Username</label>
                        <div className={`mt-1 flex items-center rounded-lg border overflow-hidden ${
                          usernameStatus === "taken" ? "border-red-400" :
                          usernameStatus === "available" ? "border-green-400" : ""
                        }`} style={{ borderColor: usernameStatus === "idle" || usernameStatus === "checking" ? "rgba(240,236,224,0.4)" : undefined }}>
                          <span className="px-3 text-sm py-2" style={{ color: "var(--tv-navy)", backgroundColor: "rgba(255,255,255,0.9)", borderRight: "1px solid rgba(240,236,224,0.4)" }}>@</span>
                          <input
                            value={editUsername}
                            onChange={(e) => handleUsernameChange(e.target.value)}
                            placeholder="username"
                            className="flex-1 px-3 py-2 text-sm focus:outline-none"
                            style={{ color: "var(--tv-navy)", backgroundColor: "rgba(255,255,255,0.9)" }}
                          />
                          <span className="pr-3 text-sm">
                            {usernameStatus === "checking" && <span className="text-gray-400">…</span>}
                            {usernameStatus === "available" && <span className="text-green-500">✓</span>}
                            {usernameStatus === "taken" && <span className="text-red-500">✗</span>}
                          </span>
                        </div>
                        {usernameStatus === "taken" && <p className="text-xs text-red-500 mt-1">That username is already taken.</p>}
                        {usernameStatus === "available" && <p className="text-xs text-green-600 mt-1">Username is available!</p>}
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(240,236,224,0.8)", fontFamily: "var(--font-fredoka)" }}>Bio</label>
                        <textarea
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          placeholder="Tell us about yourself…"
                          rows={3}
                          className="mt-1 block w-full rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                          style={{ border: "1px solid rgba(240,236,224,0.4)", color: "var(--tv-navy)", backgroundColor: "rgba(255,255,255,0.9)" }}
                        />
                      </div>
                      {saveError && <p className="text-xs text-red-500">{saveError}</p>}
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleSave}
                          disabled={saving || uploadingAvatar || usernameStatus === "taken" || usernameStatus === "checking"}
                          className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50 transition-opacity hover:opacity-90"
                          style={{ backgroundColor: "var(--tv-navy)", color: "var(--tv-cream)", fontFamily: "var(--font-fredoka)" }}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-50"
                          style={{ backgroundColor: "rgba(240,236,224,0.2)", color: "var(--tv-cream)", fontFamily: "var(--font-fredoka)" }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold truncate" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>
                          {displayName || "No name set"}
                        </h1>
                        <button onClick={() => setEditing(true)} title="Edit profile" className="transition hover:opacity-70">
                          <img src="/assets/pencil.png" alt="Edit" width={18} height={18} style={{ display: "inline", filter: "brightness(0) invert(1)" }} />
                        </button>
                      </div>
                      {displayUsername && (
                        <p className="text-sm font-bold mt-0.5" style={{ color: "var(--tv-blue)" }}>@{displayUsername}</p>
                      )}
                      <p className="text-sm mt-1 break-all" style={{ color: "rgba(240,236,224,0.85)", fontFamily: "var(--font-fredoka)" }}>{user.email}</p>
                      <p className="text-xs mt-1" style={{ color: "rgba(240,236,224,0.7)" }}>Member since {memberSince}</p>
                      {displayBio ? (
                        <p className="text-sm mt-3 leading-relaxed break-words" style={{ color: "var(--tv-cream)" }}>{displayBio}</p>
                      ) : (
                        <p className="text-sm mt-3 italic" style={{ color: "rgba(240,236,224,0.6)" }}>
                          No bio yet.{" "}
                          <button onClick={() => setEditing(true)} className="hover:underline not-italic" style={{ color: "var(--tv-cream)" }}>Add one</button>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats — stacked */}
            <StatCard icon="/assets/plane.png"  label="Trips"     value={tripCount === null ? "…" : tripCount} />
            <StatCard icon="/assets/world.png"  label="Countries" value={uniqueCountries.length} />
            <StatCard icon="/assets/city.png"   label="Cities"    value={visitedCities.length} />
          </div>

          {/* ── Right column 65% ── */}
          <div className="flex-1 min-w-0">
            <TravelMap
              visitedCities={visitedCities}
              onCityAdded={(city) => setVisitedCities((prev) => [...prev, city])}
              onCityRemoved={(id) => setVisitedCities((prev) => prev.filter((c) => c.id !== id))}
            />
          </div>

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: "var(--tv-navy)", boxShadow: "0 1px 6px rgba(53,82,172,0.2)" }}>
      <img src={icon} alt={label} width={44} height={44} style={{ objectFit: "contain", flexShrink: 0 }} />
      <div>
        <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}>{value}</div>
        <div className="text-sm" style={{ color: "rgba(240,236,224,0.75)", fontFamily: "var(--font-fredoka)" }}>{label}</div>
      </div>
    </div>
  );
}

