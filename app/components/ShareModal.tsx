"use client";

import { useEffect, useState } from "react";

type AccessUser = {
  id: string; // SharedAccess record id
  user: { id: string; name: string | null; username: string | null; email: string | null; avatarUrl: string | null };
  accessedAt: string;
  permission: "view" | "edit"; // derived from parent ShareLink
};

type ShareLinkData = {
  id: string;
  token: string;
  permission: "view" | "edit";
  accesses: AccessUser[];
};

type Props = {
  resourceType: "plan" | "page";
  resourceId: string;
  resourceTitle: string;
  onClose: () => void;
};

export function ShareModal({ resourceType, resourceId, resourceTitle, onClose }: Props) {
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<ShareLinkData[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingPermId, setChangingPermId] = useState<string | null>(null);

  // Load existing links + people on open
  useEffect(() => {
    fetch(`/api/share?planId=${resourceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.links) {
          setLinks(data.links);
          // If a link already exists for the current permission, pre-populate
          const existing = data.links.find((l: ShareLinkData) => l.permission === permission);
          if (existing) setLink(`${window.location.origin}/shared/${existing.token}`);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPeople(false));
  }, [resourceId]);

  // Re-populate link field when permission tab switches
  useEffect(() => {
    const existing = links.find((l) => l.permission === permission);
    setLink(existing ? `${window.location.origin}/shared/${existing.token}` : null);
    setCopied(false);
  }, [permission, links]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceType, resourceId, permission }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? `HTTP ${res.status}`);
      const { token } = await res.json();
      const newLink = `${window.location.origin}/shared/${token}`;
      setLink(newLink);
      // Add to local links state
      setLinks((prev) => {
        const exists = prev.find((l) => l.permission === permission);
        if (exists) return prev;
        return [...prev, { id: "", token, permission, accesses: [] }];
      });
    } catch (err: any) {
      alert(`Failed to generate link: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const changePermission = async (accessId: string, newPermission: "view" | "edit") => {
    setChangingPermId(accessId);
    try {
      const res = await fetch(`/api/share/access/revoke/${accessId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permission: newPermission }),
      });
      if (!res.ok) throw new Error();
      // Reload people list since the underlying access record changed
      const data = await fetch(`/api/share?planId=${resourceId}`).then((r) => r.json());
      if (data.links) setLinks(data.links);
    } catch {
      alert("Failed to change permission. Please try again.");
    } finally {
      setChangingPermId(null);
    }
  };

  const removeAccess = async (accessId: string) => {
    setRemovingId(accessId);
    try {
      const res = await fetch(`/api/share/access/revoke/${accessId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      // Remove from local state
      setLinks((prev) =>
        prev.map((l) => ({
          ...l,
          accesses: l.accesses.filter((a) => a.id !== accessId),
        }))
      );
    } catch {
      alert("Failed to remove access. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  // Flatten all accesses across links; permission is stored on the access after any change
  const allAccesses: AccessUser[] = links.flatMap((l) =>
    l.accesses.map((a) => ({
      ...a,
      permission: (a as any).permission ?? l.permission,
    }))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Share</h2>
            <p className="text-sm text-gray-500 truncate max-w-[300px]">{resourceTitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Permission toggle */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Permission</p>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(["view", "edit"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPermission(p)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  permission === p ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p === "view" ? "👁 View only" : "✏️ Can edit"}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {permission === "view"
              ? "Recipients can read content but not make changes."
              : "Recipients can edit content in real time."}
          </p>
        </div>

        {/* Link */}
        {link ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="flex-1 text-xs text-gray-600 truncate font-mono">{link}</span>
              <button onClick={copy} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <button
              onClick={generate}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "Generating…" : "Generate link"}
            </button>
          </div>
        )}

        {link && (
          <div className="mb-5">
            <button
              onClick={copy}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy link"}
            </button>
          </div>
        )}

        {/* People with access */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            People with access
          </p>
          {loadingPeople ? (
            <p className="text-xs text-gray-400 animate-pulse">Loading…</p>
          ) : allAccesses.length === 0 ? (
            <p className="text-xs text-gray-400">No one has accessed a shared link yet.</p>
          ) : (
            <ul className="space-y-2">
              {allAccesses.map((access) => {
                const name = access.user.name;
                const username = access.user.username;
                const displayName = name || username || "Unknown";
                const initials = displayName.charAt(0).toUpperCase();
                // Format: "(Name) @username" or "(username) @username" if no name
                const label = username
                  ? `(${displayName}) @${username}`
                  : `(${displayName})`;

                return (
                  <li key={access.id} className="flex items-center gap-3">
                    {access.user.avatarUrl ? (
                      <img src={access.user.avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{label}</p>
                    </div>
                    {/* Permission toggle */}
                    <button
                      onClick={() => changePermission(access.id, access.permission === "view" ? "edit" : "view")}
                      disabled={changingPermId === access.id}
                      className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0 disabled:opacity-40 transition-colors"
                      style={
                        access.permission === "edit"
                          ? { background: "#f0fdf4", color: "#15803d" }
                          : { background: "#f3f4f6", color: "#6b7280" }
                      }
                      title="Click to toggle permission"
                    >
                      {changingPermId === access.id ? "…" : access.permission === "edit" ? "✏️ Edit" : "👁 View"}
                    </button>
                    <button
                      onClick={() => removeAccess(access.id)}
                      disabled={removingId === access.id}
                      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-40 shrink-0"
                      title="Remove access"
                    >
                      {removingId === access.id ? "…" : "Remove"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
