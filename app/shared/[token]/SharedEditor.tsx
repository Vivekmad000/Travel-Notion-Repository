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

type Props = {
  pageId: string;
  initialTitle: string;
  initialContent: string | null;
  editable: boolean;
  userName: string;
  userColor: string;
};

// ─── Entry point ─────────────────────────────────────────────────────────────
export default function SharedEditor(props: Props) {
  if (props.editable) {
    return (
      <RoomProvider
        id={`page-${props.pageId}`}
        initialPresence={{ cursor: null, name: props.userName, color: props.userColor }}
      >
        <SharedEditorWithRoom {...props} />
      </RoomProvider>
    );
  }
  return <SharedEditorReadOnly {...props} />;
}

// ─── Read-only ────────────────────────────────────────────────────────────────
function SharedEditorReadOnly({ initialTitle, initialContent }: Props) {
  const initialBlocks = useMemo(() => {
    try { return initialContent ? JSON.parse(initialContent) : undefined; }
    catch { return undefined; }
  }, [initialContent]);

  const editor = useCreateBlockNote({ schema, initialContent: initialBlocks });

  return (
    <div className="flex flex-col max-w-4xl mx-auto px-8 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">{initialTitle}</h1>
      <BlockNoteView editor={editor} theme="light" editable={false} className="min-h-[500px]" />
    </div>
  );
}

// ─── Collaborative: waits for Y.Doc + provider before rendering editor ────────
type ReadyState = { doc: Y.Doc; provider: LiveblocksYjsProvider; needsSeed: boolean };

function SharedEditorWithRoom(props: Props) {
  const room = useRoom();
  const others = useOthers();
  const [ready, setReady] = useState<ReadyState | null>(null);

  useEffect(() => {
    const yDoc = new Y.Doc();
    const yProvider = new LiveblocksYjsProvider(room, yDoc);

    const handleSync = () => {
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
    return <div className="px-8 py-10 text-gray-400 text-sm animate-pulse">Connecting…</div>;
  }

  return <SharedEditorInner {...props} {...ready} others={others} />;
}

// ─── Inner: BlockNote editor, only mounts when doc+provider are stable ────────
type InnerProps = Props & ReadyState & {
  others: readonly { connectionId: number; presence: Presence }[];
};

function SharedEditorInner({ pageId, initialTitle, initialContent, userName, userColor, doc, provider, needsSeed, others }: InnerProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
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
      const isImage = file.type.startsWith("image/");
      const [res] = await uploadFiles(isImage ? "imageUploader" : ("fileUploader" as any), { files: [file] });
      return res.url;
    },
  });

  useEffect(() => {
    if (!needsSeed || !initialBlocks || seededRef.current) return;
    seededRef.current = true;
    editor.replaceBlocks(editor.document, initialBlocks);
  }, [editor, needsSeed, initialBlocks]);

  useEditorChange(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/pages/${pageId}/content`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: JSON.stringify(editor.document) }),
        });
        if (!res.ok) throw new Error();
        setLastSaved(new Date());
        setSaveStatus("saved");
      } catch { setSaveStatus("error"); }
    }, 2000);
  }, editor);

  const activeOthers = others.filter((o) => o.presence?.name);

  return (
    <div className="flex flex-col max-w-4xl mx-auto px-8 py-10">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">{initialTitle}</h1>
      <div className="flex items-center justify-between h-5 mb-4">
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
