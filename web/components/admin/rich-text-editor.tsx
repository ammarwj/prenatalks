"use client";

import Link from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
} from "lucide-react";

import { cn } from "@/lib/utils";

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active ? "bg-primary/15 text-primary-text" : "hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Editor rich text TipTap (PRD §9 F-08). Isi disimpan sebagai HTML mentah;
 * disanitasi ulang saat dirender di halaman publik (lihat
 * lib/sanitize-html.ts) supaya XSS tetap tercegah meski penulisnya admin.
 *
 * `value` hanya dipakai sebagai konten AWAL (TipTap tidak mengikuti
 * perubahan prop `content` setelah mount) — pemanggil yang perlu me-reset
 * isi editor dari data server (mis. halaman edit) wajib me-remount lewat
 * `key`, sama seperti pola `QuestionnaireForm`/`FormBuilderForm`.
 */
export function RichTextEditor({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (html: string) => void;
  error?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base max-w-none min-h-[240px] focus:outline-none px-4 py-3",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/40" />;
  }

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL tautan", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-white",
        error ? "border-danger" : "border-input"
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/30 p-1.5">
        <ToolbarButton
          label="Tebal"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Miring"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Judul 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Judul 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Daftar poin"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Daftar bernomor"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Kutipan"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="size-4" />
        </ToolbarButton>
        <ToolbarButton label="Tautan" active={editor.isActive("link")} onClick={setLink}>
          <LinkIcon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" />
        <ToolbarButton
          label="Urungkan"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Ulangi"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo className="size-4" />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
