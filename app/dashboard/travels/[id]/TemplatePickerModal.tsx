'use client';

import Image from "next/image";

// ─── Template Definitions ─────────────────────────────────────────────────────

export type Template = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  defaultTitle: string;
};

export const TEMPLATES: Template[] = [
  {
    slug: "outfit-planner",
    name: "Outfit Planner",
    description: "Plan your looks day by day",
    icon: "/assets/eyeglass.png",
    defaultTitle: "Outfit Planner",
  },
];

// ─── Props ────────────────────────────────────────────────────────────────────

type TemplatePickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlank: () => void;
  onSelectTemplate: (template: Template) => void;
  parentTitle?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplatePickerModal({
  isOpen,
  onClose,
  onSelectBlank,
  onSelectTemplate,
  parentTitle,
}: TemplatePickerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal panel */}
      <div
        className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "var(--tv-cream)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: "var(--tv-navy)" }}
        >
          <h2
            className="text-3xl"
            style={{ fontFamily: "var(--font-ocean-trace)", color: "var(--tv-cream)" }}
          >
            New Page
          </h2>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-60 transition-opacity"
            style={{ color: "var(--tv-cream)", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Parent context */}
          {parentTitle && (
            <p
              className="text-sm px-3 py-2 rounded-lg"
              style={{
                fontFamily: "var(--font-nunito)",
                backgroundColor: "rgba(53,82,172,0.08)",
                color: "var(--tv-blue)",
              }}
            >
              Adding under: <span className="font-semibold">{parentTitle}</span>
            </p>
          )}

          {/* Start Fresh */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-blue)" }}
            >
              Start Fresh
            </p>
            <button
              onClick={onSelectBlank}
              className="w-full rounded-xl border-2 border-dashed flex items-center gap-4 px-5 py-4 hover:shadow-md transition-shadow text-left"
              style={{
                borderColor: "var(--tv-navy)",
                backgroundColor: "white",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: "var(--tv-cream)", border: "1.5px solid var(--tv-navy)" }}
              >
                <span style={{ color: "var(--tv-navy)", fontWeight: 700, fontSize: 24 }}>+</span>
              </div>
              <div>
                <p
                  className="text-base font-semibold"
                  style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-navy)" }}
                >
                  Blank Page
                </p>
                <p
                  className="text-sm"
                  style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-blue)" }}
                >
                  Start with an empty canvas
                </p>
              </div>
            </button>
          </div>

          {/* Templates */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-3"
              style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-terracotta)" }}
            >
              Templates
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TEMPLATES.map((t) => (
                <button
                  key={t.slug}
                  onClick={() => onSelectTemplate(t)}
                  className="rounded-xl overflow-hidden text-left hover:shadow-md transition-shadow"
                  style={{ backgroundColor: "var(--tv-navy)" }}
                >
                  {/* Accent strip */}
                  <div className="h-1" style={{ backgroundColor: "var(--tv-terracotta)" }} />
                  <div className="p-4 flex flex-col gap-2">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                    >
                      <Image
                        src={t.icon}
                        alt={t.name}
                        width={28}
                        height={28}
                        style={{ width: 28, height: 28, objectFit: "contain" }}
                      />
                    </div>
                    <p
                      className="text-sm font-semibold"
                      style={{ fontFamily: "var(--font-fredoka)", color: "var(--tv-cream)" }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-xs leading-snug"
                      style={{ fontFamily: "var(--font-nunito)", color: "var(--tv-peach)" }}
                    >
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
