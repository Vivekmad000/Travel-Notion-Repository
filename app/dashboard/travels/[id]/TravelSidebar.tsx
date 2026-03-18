'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CreatePageModal } from "./CreatePageModal";
import { TemplatePickerModal, type Template } from "./TemplatePickerModal";
import { ShareModal } from "@/app/components/ShareModal";

type Page = {
  id: string;
  title: string;
  depth: number;
  travelPlanId: string;
  parentPageId: string | null;
  createdAt: string;
  updatedAt: string;
};

type TravelPlan = {
  id: string;
  title: string;
  description: string | null;
  cities: string | null;
  startDate: string | null;
  endDate: string | null;
};

type TravelSidebarProps = {
  travelPlanId: string;
  initialTravelPlan: TravelPlan;
  initialPages: Page[];
};

type PageNode = Page & { children: PageNode[] };

function buildTree(pages: Page[]): PageNode[] {
  const map = new Map<string, PageNode>();
  const roots: PageNode[] = [];
  for (const page of pages) map.set(page.id, { ...page, children: [] });
  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parentPageId && map.has(page.parentPageId)) {
      map.get(page.parentPageId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function PageItem({
  page,
  travelPlanId,
  currentPageId,
  onAddChild,
  onDelete,
}: {
  page: PageNode;
  travelPlanId: string;
  currentPageId: string | null;
  onAddChild: (page: PageNode) => void;
  onDelete: (pageId: string) => void;
}) {
  const isActive = currentPageId === page.id;
  const paddingLeft = page.depth * 16 + 12;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1.5 pr-2 rounded-lg transition-colors ${
          isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-100 text-gray-700"
        }`}
        style={{ paddingLeft }}
      >
        <Link
          href={`/dashboard/travels/${travelPlanId}/pages/${page.id}`}
          className="flex-1 text-sm truncate"
        >
          {page.title}
        </Link>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {page.depth < 4 && (
            <button
              onClick={() => onAddChild(page)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded text-xs"
              title="Add subpage"
            >
              +
            </button>
          )}
          <button
            onClick={() => onDelete(page.id)}
            className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded text-xs"
            title="Delete page"
          >
            ×
          </button>
        </div>
      </div>
      {page.children.map((child) => (
        <PageItem
          key={child.id}
          page={child}
          travelPlanId={travelPlanId}
          currentPageId={currentPageId}
          onAddChild={onAddChild}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export function TravelSidebar({ travelPlanId, initialTravelPlan, initialPages }: TravelSidebarProps) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [travelPlan] = useState(initialTravelPlan);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTitle, setDefaultTitle] = useState("");
  const [defaultTemplateSlug, setDefaultTemplateSlug] = useState<string | undefined>(undefined);
  const [selectedParent, setSelectedParent] = useState<{ id: string | null; depth: number; title?: string }>({
    id: null,
    depth: -1,
  });
  const [shareOpen, setShareOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const currentPageMatch = pathname.match(/\/pages\/([^/]+)/);
  const currentPageId = currentPageMatch ? currentPageMatch[1] : null;

  const tree = buildTree(pages);

  const handleAddRootPage = () => {
    setSelectedParent({ id: null, depth: -1 });
    setDefaultTitle("");
    setTemplatePickerOpen(true);
  };

  const handleAddChild = (page: PageNode) => {
    setSelectedParent({ id: page.id, depth: page.depth, title: page.title });
    setDefaultTitle("");
    setTemplatePickerOpen(true);
  };

  const handleSelectBlank = () => {
    setTemplatePickerOpen(false);
    setDefaultTitle("");
    setDefaultTemplateSlug(undefined);
    setModalOpen(true);
  };

  const handleSelectTemplate = async (template: Template) => {
    setTemplatePickerOpen(false);
    // Create the page directly — no title modal for templates
    try {
      const res = await fetch(`/api/travel-plans/${travelPlanId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: template.defaultTitle,
          templateSlug: template.slug,
          parentPageId: selectedParent.id,
        }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setPages((prev) => [...prev, json.data]);
        router.push(`/dashboard/travels/${travelPlanId}/pages/${json.data.id}`);
      }
    } catch {
      // fall back silently
    }
  };

  const handlePageCreated = (page: Page) => {
    setPages((prev) => [...prev, page]);
    router.push(`/dashboard/travels/${travelPlanId}/pages/${page.id}`);
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm("Delete this page and all its subpages?")) return;
    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: "DELETE" });
      if (res.ok) {
        setPages((prev) => {
          const toDelete = new Set<string>();
          const collect = (id: string) => {
            toDelete.add(id);
            prev.filter((p) => p.parentPageId === id).forEach((p) => collect(p.id));
          };
          collect(pageId);
          return prev.filter((p) => !toDelete.has(p.id));
        });
        if (currentPageId && pages.find((p) => p.id === currentPageId)) {
          router.push(`/dashboard/travels/${travelPlanId}`);
        }
      }
    } catch {
      alert("Failed to delete page");
    }
  };

  return (
    <>
      <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col sticky top-0 max-h-screen overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 mb-3 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
              {travelPlan.title}
            </h2>
            <button
              onClick={() => setShareOpen(true)}
              className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
              title="Share this travel plan"
            >
              🔗
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pages</span>
            <button
              onClick={handleAddRootPage}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors text-sm"
              title="Add page"
            >
              +
            </button>
          </div>

          {tree.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-400 mb-2">No pages yet</p>
              <button
                onClick={handleAddRootPage}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create first page
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {tree.map((page) => (
                <PageItem
                  key={page.id}
                  page={page}
                  travelPlanId={travelPlanId}
                  currentPageId={currentPageId}
                  onAddChild={handleAddChild}
                  onDelete={handleDeletePage}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      <TemplatePickerModal
        isOpen={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelectBlank={handleSelectBlank}
        onSelectTemplate={handleSelectTemplate}
        parentTitle={selectedParent.title}
      />

      <CreatePageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        travelPlanId={travelPlanId}
        parentPageId={selectedParent.id}
        parentDepth={selectedParent.depth}
        parentTitle={selectedParent.title}
        defaultTitle={defaultTitle}
        templateSlug={defaultTemplateSlug}
        onSuccess={handlePageCreated}
      />

      {shareOpen && (
        <ShareModal
          resourceType="plan"
          resourceId={travelPlanId}
          resourceTitle={travelPlan.title}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
