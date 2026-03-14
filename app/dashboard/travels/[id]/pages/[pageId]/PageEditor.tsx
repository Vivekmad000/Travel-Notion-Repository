"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { BlockNoteSchema, defaultBlockSpecs, createHeadingBlockSpec } from "@blocknote/core";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import * as Y from "yjs";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { RoomProvider, useRoom, useOthers, type Presence } from "@/liveblocks.config";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

const { uploadFiles } = generateReactHelpers<OurFileRouter>({ url: "/api/uploadthing" });

const { toggleListItem, ...otherBlockSpecs } = defaultBlockSpecs;
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...otherBlockSpecs,
    heading: createHeadingBlockSpec({ allowToggleHeadings: false }),
  },
});

type SaveStatus = "idle" | "saving" | "saved" | "error";

type PageEditorProps = {
  pageId: string;
  initialTitle: string;
  initialContent: string | null;
  userName: string;
  userColor: string;
};

// ─── 1. Outer: RoomProvider ───────────────────────────────────────────────────
export function PageEditor(props: PageEditorProps) {
  return (
    <RoomProvider
      id={`page-${props.pageId}`}
      initialPresence={{ cursor: null, name: props.userName, color: props.userColor }}
    >
      <PageEditorWithRoom {...props} />
    </RoomProvider>
  );
}

// ─── 2. Middle: creates Y.Doc + provider, waits for Liveblocks sync ───────────
// We MUST wait for sync before passing doc/provider to the editor.
// This lets us check whether the room is brand-new BEFORE BlockNote touches the Y.Doc.
type ReadyState = { doc: Y.Doc; provider: LiveblocksYjsProvider; needsSeed: boolean };

function PageEditorWithRoom(props: PageEditorProps) {
  const room = useRoom();
  const others = useOthers();
  const [ready, setReady] = useState<ReadyState | null>(null);

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);

    const handleSync = () => {
      // Check BEFORE BlockNote renders — if fragment is empty, this is a new room
      const fragment = yDoc.getXmlFragment("document-store");
      const needsSeed = fragment.length === 0;
      setReady({ doc: yDoc, provider: yProvider, needsSeed });
    };

    if (yProvider.synced) {
      handleSync();
    } else {
      yProvider.on("synced", handleSync);
    }

    return () => {
      yProvider.off("synced", handleSync);
      yDoc.destroy();
      yProvider.destroy();
    };
  }, [room]);

  if (!ready) {
    return <div className="px-[54px] py-8 text-gray-400 text-sm animate-pulse">Connecting…</div>;
  }

  return <PageEditorInner {...props} {...ready} others={others} />;
}

// ─── 3. Inner: BlockNote editor — only mounts after sync ─────────────────────
type InnerProps = PageEditorProps & ReadyState & {
  others: readonly { connectionId: number; presence: Presence }[];
};

function PageEditorInner({
  pageId, initialTitle, initialContent, userName, userColor,
  doc, provider, needsSeed, others,
}: InnerProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const titleRef = useRef(title);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seededRef = useRef(false);

  const initialBlocks = useMemo(() => {
    try { return initialContent ? JSON.parse(initialContent) : undefined; }
    catch { return undefined; }
  }, [initialContent]);

  const editor = useCreateBlockNote({
    schema,
    collaboration: {
      provider: provider as any,
      fragment: doc.getXmlFragment("document-store"),
      user: { name: userName, color: userColor },
      showCursorLabels: "activity",
    },
    uploadFile: async (file: File) => {
      try {
        const isImage = file.type.startsWith("image/");
        const [res] = await Promise.race([
          uploadFiles(isImage ? "imageUploader" : ("fileUploader" as any), { files: [file] }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Upload timed out")), 30000)),
        ]) as any;
        return res.url;
      } catch (err) {
        console.error("File upload failed:", err);
        throw err;
      }
    },
  });

  // If this is a brand-new room, seed the Y.Doc from DB content
  useEffect(() => {
    if (!needsSeed || !initialBlocks || seededRef.current) return;
    seededRef.current = true;
    editor.replaceBlocks(editor.document, initialBlocks);
  }, [editor, needsSeed, initialBlocks]);

  const scheduleSave = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/pages/${pageId}/content`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: JSON.stringify(editor.document), title: titleRef.current }),
        });
        if (!res.ok) throw new Error();
        setSaveStatus("saved");
        setLastSaved(new Date());
      } catch { setSaveStatus("error"); }
    }, 2000);
  };

  useEditorChange(() => { scheduleSave(); }, editor);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    titleRef.current = val;
    scheduleSave();
  };

  const activeOthers = others.filter((o) => o.presence?.name);

  return (
    <div className="flex flex-col">
      <input
        type="text"
        value={title}
        onChange={handleTitleChange}
        placeholder="Untitled"
        className="text-4xl font-bold text-gray-900 w-full border-none outline-none bg-transparent placeholder-gray-300 mb-2 px-[54px]"
      />
      <div className="flex items-center justify-between mb-4 px-[54px] h-5">
        <div className="flex items-center gap-2">
          {saveStatus === "saving" && <span className="text-xs text-gray-400 animate-pulse">Saving...</span>}
          {saveStatus === "saved" && (
            <span className="text-xs text-gray-400">
              Saved{lastSaved ? ` at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}
            </span>
          )}
          {saveStatus === "error" && <span className="text-xs text-red-400">Failed to save</span>}
        </div>
        {activeOthers.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 mr-1">Also editing:</span>
            {activeOthers.slice(0, 5).map((other) => (
              <div
                key={other.connectionId}
                title={other.presence.name}
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white"
                style={{ backgroundColor: other.presence.color }}
              >
                {other.presence.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {activeOthers.length > 5 && <span className="text-xs text-gray-500">+{activeOthers.length - 5}</span>}
          </div>
        )}
      </div>
      <BlockNoteView editor={editor} theme="light" className="min-h-[500px]" />
    </div>
  );
}