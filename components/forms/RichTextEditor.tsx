"use client";

import { useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  invalid?: boolean;
}

/**
 * Tiptap editor for property descriptions. Produces HTML with headings, bold/italic/underline/
 * strike, lists, quotes, dividers and links. The server sanitizes it before saving and again
 * before it is rendered on the property page (lib/rich-text.ts).
 */
export default function RichTextEditor({ value, onChange, placeholder, invalid }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // avoids a hydration mismatch in Next.js
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto", "tel"],
          HTMLAttributes: { target: "_blank", rel: "noopener noreferrer nofollow" },
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rich-text min-h-[180px] px-4 py-3 text-sm text-ink focus:outline-none",
        "aria-label": "Description",
        "aria-multiline": "true",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // Keep the editor in sync if the value is replaced from outside (e.g. a different listing loads).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (value !== current) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-control border bg-surface transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15",
        invalid ? "border-danger" : "border-border"
      )}
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-border bg-surface-muted/60" />}
      <div className="relative">
        {editor?.isEmpty && placeholder && (
          <p className="pointer-events-none absolute left-4 top-3 text-sm text-subtle">{placeholder}</p>
        )}
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const [linkOpen, setLinkOpen] = useState(false);
  // Re-render the toolbar when the selection's formatting changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive("paragraph"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();
  const groups: { icon: LucideIcon; label: string; active?: boolean; disabled?: boolean; run: () => void }[][] = [
    [
      { icon: Pilcrow, label: "Paragraph", active: state.paragraph, run: () => chain().setParagraph().run() },
      { icon: Heading2, label: "Heading", active: state.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
      { icon: Heading3, label: "Sub-heading", active: state.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    ],
    [
      { icon: Bold, label: "Bold (Ctrl+B)", active: state.bold, run: () => chain().toggleBold().run() },
      { icon: Italic, label: "Italic (Ctrl+I)", active: state.italic, run: () => chain().toggleItalic().run() },
      { icon: Underline, label: "Underline (Ctrl+U)", active: state.underline, run: () => chain().toggleUnderline().run() },
      { icon: Strikethrough, label: "Strikethrough", active: state.strike, run: () => chain().toggleStrike().run() },
    ],
    [
      { icon: List, label: "Bullet list", active: state.bullet, run: () => chain().toggleBulletList().run() },
      { icon: ListOrdered, label: "Numbered list", active: state.ordered, run: () => chain().toggleOrderedList().run() },
      { icon: Quote, label: "Quote", active: state.quote, run: () => chain().toggleBlockquote().run() },
      { icon: Minus, label: "Divider", run: () => chain().setHorizontalRule().run() },
    ],
    [
      { icon: Link2, label: "Add link", active: state.link, run: () => setLinkOpen((o) => !o) },
      { icon: Link2Off, label: "Remove link", disabled: !state.link, run: () => chain().extendMarkRange("link").unsetLink().run() },
    ],
    [
      { icon: Undo2, label: "Undo (Ctrl+Z)", disabled: !state.canUndo, run: () => chain().undo().run() },
      { icon: Redo2, label: "Redo (Ctrl+Y)", disabled: !state.canRedo, run: () => chain().redo().run() },
    ],
  ];

  return (
    <div className="border-b border-border bg-surface-muted/60">
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1.5" role="toolbar" aria-label="Formatting">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />}
            {group.map(({ icon: Icon, label, active, disabled, run }) => (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={label}
                aria-pressed={active}
                disabled={disabled}
                onMouseDown={(e) => e.preventDefault()} // keep the text selection
                onClick={run}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition disabled:cursor-not-allowed disabled:opacity-35",
                  active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        ))}
      </div>
      {linkOpen && (
        <LinkBar
          initial={(editor.getAttributes("link").href as string | undefined) ?? ""}
          onClose={() => setLinkOpen(false)}
          onApply={(href) => {
            const range = editor.chain().focus().extendMarkRange("link");
            if (!href) range.unsetLink().run();
            else if (editor.state.selection.empty && !state.link) {
              // Nothing selected: insert the URL itself as linked text.
              editor.chain().focus().insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
            } else range.setLink({ href }).run();
            setLinkOpen(false);
          }}
        />
      )}
    </div>
  );
}

function LinkBar({
  initial,
  onApply,
  onClose,
}: {
  initial: string;
  onApply: (href: string) => void;
  onClose: () => void;
}) {
  const [href, setHref] = useState(initial);
  const normalized = () => {
    const v = href.trim();
    if (!v) return "";
    return /^(https?:|mailto:|tel:)/i.test(v) ? v : `https://${v}`;
  };
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-border px-2 py-2">
      <input
        autoFocus
        value={href}
        onChange={(e) => setHref(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onApply(normalized());
          }
          if (e.key === "Escape") onClose();
        }}
        placeholder="Paste a link, e.g. https://maps.google.com/…"
        className="h-8 min-w-0 flex-1 rounded-md border border-border bg-surface px-2.5 text-sm text-ink focus:border-primary focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onApply(normalized())}
        className="h-8 rounded-md bg-primary px-3 text-xs font-semibold text-on-primary hover:bg-primary-hover"
      >
        Apply
      </button>
      <button type="button" onClick={onClose} className="h-8 rounded-md px-2 text-xs font-medium text-muted hover:text-ink">
        Cancel
      </button>
    </div>
  );
}
