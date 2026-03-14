"use client";

import dynamic from "next/dynamic";

const PageEditor = dynamic(() => import("./PageEditor").then((m) => m.PageEditor), {
  ssr: false,
  loading: () => (
    <div className="px-[54px] py-8 text-gray-400 text-sm animate-pulse">Loading editor...</div>
  ),
});

type PageEditorLoaderProps = {
  pageId: string;
  initialTitle: string;
  initialContent: string | null;
  userName: string;
  userColor: string;
};

export function PageEditorLoader(props: PageEditorLoaderProps) {
  return <PageEditor {...props} />;
}