"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AppUserButton } from "@/app/components/AppUserButton";

const SharedEditor = dynamic(() => import("./SharedEditor"), { ssr: false });

type PageNode = {
  id: string;
  title: string;
  content: string | null;
  children: PageNode[];
};

type Props = {
  permission: "view" | "edit";
  resourceType: "plan" | "page";
  planTitle: string;
  planDescription?: string | null;
  ownerName?: string | null;
  pageTree: PageNode[];
  allPages: { id: string; title: string; content: string | null }[];
  rootPageId?: string;
  userName: string;
  userColor: string;
};

function PageTreeItem({
  node,
  selected,
  onSelect,
  depth,
}: {
  node: PageNode;
  selected: string | null;
  onSelect: (id: string) => void;
  depth: number;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${
          selected === node.id
            ? "bg-indigo-50 text-indigo-700 font-medium"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(node.id)}
      >
        {node.children.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            className="text-gray-400 text-xs w-4 shrink-0"
          >
            {open ? "▾" : "▸"}
          </button>
        )}
        {node.children.length === 0 && <span className="w-4 shrink-0" />}
        <span className="truncate">{node.title || "Untitled"}</span>
      </div>
      {open &&
        node.children.map((child) => (
          <PageTreeItem
            key={child.id}
            node={child}
            selected={selected}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ))}
    </div>
  );
}

export function SharedView({
  permission,
  planTitle,
  planDescription,
  ownerName,
  pageTree,
  allPages,
  rootPageId,
  userName,
  userColor,
}: Props) {
  const defaultPage = rootPageId ?? pageTree[0]?.id ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(defaultPage);

  const selectedPage = allPages.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* App header — same as dashboard */}
      <header className="bg-white border-b border-gray-200 shrink-0 z-10">
        <div className="max-w-full px-4 py-3 flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold text-indigo-600">
            TravelVerse
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              Shared with you
            </span>
            <AppUserButton />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Plan info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✈️</span>
              <h1 className="font-semibold text-gray-900 truncate text-sm">{planTitle}</h1>
            </div>
            {ownerName && (
              <p className="text-xs text-gray-400">Shared by {ownerName}</p>
            )}
            <span
              className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                permission === "edit"
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {permission === "edit" ? "✏️ Can edit" : "👁 View only"}
            </span>
          </div>

          {/* Page tree */}
          <nav className="flex-1 overflow-y-auto p-2">
            {pageTree.length === 0 ? (
              <p className="text-xs text-gray-400 px-3 py-2">No pages</p>
            ) : (
              pageTree.map((node) => (
                <PageTreeItem
                  key={node.id}
                  node={node}
                  selected={selectedId}
                  onSelect={setSelectedId}
                  depth={0}
                />
              ))
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {selectedPage ? (
            <SharedEditor
              key={selectedPage.id}
              pageId={selectedPage.id}
              initialTitle={selectedPage.title}
              initialContent={selectedPage.content}
              editable={permission === "edit"}
              userName={userName}
              userColor={userColor}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a page from the sidebar
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
