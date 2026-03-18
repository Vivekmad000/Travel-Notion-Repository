import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { colorForUser } from "@/lib/userColor";
import { Breadcrumb } from "@/app/components/Breadcrumb";
import { PageEditorLoader as PageEditor } from "./PageEditorLoader";
import { OutfitPlannerPage } from "./OutfitPlannerPage";

export default async function PageDetailPage({
  params,
}: {
  params: Promise<{ id: string; pageId: string }>;
}) {
  const { id, pageId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await getAuthUser();
  if (!user) redirect("/");

  const page = await prisma.page.findFirst({
    where: { id: pageId, travelPlan: { id, userId: user.id } },
    include: {
      travelPlan: true,
      children: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!page) redirect(`/dashboard/travels/${id}`);

  const breadcrumbItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: page.travelPlan.title, href: `/dashboard/travels/${id}` },
    { label: page.title },
  ];

  const userName = user.name || user.username || "Anonymous";
  const userColor = colorForUser(userId);

  // Render custom template pages instead of the BlockNote editor
  if (page.templateSlug === "outfit-planner") {
    return (
      <div>
        <div className="px-8 pt-8">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <OutfitPlannerPage
          page={{ id: page.id, title: page.title, travelPlanId: page.travelPlanId }}
          travelPlan={{
            id: page.travelPlan.id,
            title: page.travelPlan.title,
            startDate: page.travelPlan.startDate?.toISOString() ?? null,
            endDate: page.travelPlan.endDate?.toISOString() ?? null,
          }}
          userName={userName}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 py-8">
        <PageEditor
          pageId={page.id}
          initialTitle={page.title}
          initialContent={page.content ?? null}
          userName={userName}
          userColor={userColor}
        />
      </div>

      {page.children.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Subpages</h2>
          <div className="space-y-2">
            {page.children.map((child) => (
              <a
                key={child.id}
                href={`/dashboard/travels/${id}/pages/${child.id}`}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
              >
                <span className="text-gray-400 group-hover:text-indigo-500">📄</span>
                <span className="text-gray-700 group-hover:text-indigo-700 font-medium">{child.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
