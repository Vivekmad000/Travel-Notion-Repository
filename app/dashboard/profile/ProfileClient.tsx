"use client";

import { useState, useEffect, useRef } from "react";
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={avatarSrc}
                alt={displayName || "Profile"}
                onClick={handleAvatarClick}
                className={`w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition ${
                  editing
                    ? "cursor-pointer ring-2 ring-indigo-400 hover:opacity-80"
                    : ""
                }`}
              />
              {editing && (
                <div
                  onClick={handleAvatarClick}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 cursor-pointer"
                >
                  <span className="text-white text-xs font-medium">
                    {uploadingAvatar ? "Uploading…" : "Change"}
                  </span>
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Info / Edit form */}
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Name
                    </label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your name"
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Username
                    </label>
                    <div className={`mt-1 flex items-center rounded-lg border overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 ${
                      usernameStatus === "taken" ? "border-red-400" :
                      usernameStatus === "available" ? "border-green-400" :
                      "border-gray-300"
                    }`}>
                      <span className="px-3 text-gray-400 text-sm bg-gray-50 border-r border-gray-300 py-2">
                        @
                      </span>
                      <input
                        value={editUsername}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="username"
                        className="flex-1 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                      />
                      <span className="pr-3 text-sm">
                        {usernameStatus === "checking" && (
                          <span className="text-gray-400">…</span>
                        )}
                        {usernameStatus === "available" && (
                          <span className="text-green-500">✓</span>
                        )}
                        {usernameStatus === "taken" && (
                          <span className="text-red-500">✗</span>
                        )}
                      </span>
                    </div>
                    {usernameStatus === "taken" && (
                      <p className="text-xs text-red-500 mt-1">
                        That username is already taken.
                      </p>
                    )}
                    {usernameStatus === "available" && (
                      <p className="text-xs text-green-600 mt-1">
                        Username is available!
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Bio
                    </label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Tell us about yourself…"
                      rows={3}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                  {saveError && (
                    <p className="text-xs text-red-500">{saveError}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSave}
                      disabled={saving || uploadingAvatar || usernameStatus === "taken" || usernameStatus === "checking"}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 truncate">
                      {displayName || "No name set"}
                    </h1>
                    <button
                      onClick={() => setEditing(true)}
                      title="Edit profile"
                      className="text-gray-400 hover:text-indigo-600 transition"
                    >
                      ✏️
                    </button>
                  </div>
                  {displayUsername && (
                    <p className="text-sm text-indigo-600 font-medium mt-0.5">
                      @{displayUsername}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Member since {memberSince}
                  </p>
                  {displayBio ? (
                    <p className="text-sm text-gray-700 mt-3 leading-relaxed">
                      {displayBio}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-3 italic">
                      No bio yet.{" "}
                      <button
                        onClick={() => setEditing(true)}
                        className="text-indigo-500 hover:underline not-italic"
                      >
                        Add one
                      </button>
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            emoji="✈️"
            label="Trips"
            value={tripCount === null ? "…" : tripCount}
          />
          <StatCard
            emoji="🌍"
            label="Countries"
            value={uniqueCountries.length}
          />
          <StatCard
            emoji="🏙️"
            label="Cities"
            value={visitedCities.length}
          />
        </div>

        {/* Interactive map — city management syncs stats */}
        <TravelMap
          visitedCities={visitedCities}
          onCityAdded={(city) => setVisitedCities((prev) => [...prev, city])}
          onCityRemoved={(id) =>
            setVisitedCities((prev) => prev.filter((c) => c.id !== id))
          }
        />
      </main>
    </div>
  );
}

function StatCard({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}

