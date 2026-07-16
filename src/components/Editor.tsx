"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import type { AccessRole } from "@/lib/permissions";
import { canEdit as canEditRole } from "@/lib/permissions";
import ShareDialog from "@/components/ShareDialog";
import {
  downloadTextFile,
  htmlToMarkdown,
  printDocument,
  safeFilename,
} from "@/lib/export";

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

export default function Editor({
  documentId,
  initialTitle,
  initialContent,
  initialStarred,
  role,
}: {
  documentId: string;
  initialTitle: string;
  initialContent: string;
  initialStarred: boolean;
  role: AccessRole;
}) {
  const editable = canEditRole(role);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [shareOpen, setShareOpen] = useState(false);
  const [starred, setStarred] = useState(initialStarred);

  async function toggleStar() {
    const next = !starred;
    setStarred(next);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: next }),
      });
    } catch {
      setStarred(!next); // revert on failure
    }
  }

  const pending = useRef<{ title?: string; content?: string }>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const body = pending.current;
    pending.current = {};
    if (Object.keys(body).length === 0) return;
    setStatus("saving");
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("save failed");
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }, [documentId]);

  const queueSave = useCallback(
    (partial: { title?: string; content?: string }) => {
      pending.current = { ...pending.current, ...partial };
      setStatus("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 800);
    },
    [flush]
  );

  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Placeholder.configure({ placeholder: "Start writing your document…" }),
    ],
    content: initialContent,
    editorProps: {
      attributes: { class: "doc-content min-h-[55vh] px-8 py-8 sm:px-14" },
    },
    onUpdate: ({ editor }) => queueSave({ content: editor.getHTML() }),
  });

  // Re-render on every transaction so toolbar states + word count stay live.
  const [, tick] = useReducer((x) => x + 1, 0);
  useEffect(() => {
    if (!editor) return;
    editor.on("transaction", tick);
    return () => {
      editor.off("transaction", tick);
    };
  }, [editor]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      void flush();
    };
  }, [flush]);

  function onTitleChange(value: string) {
    setTitle(value);
    if (value.trim()) queueSave({ title: value.trim() });
  }

  const text = editor?.getText() ?? "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  function exportMarkdown() {
    if (!editor) return;
    const md = `# ${title}\n\n${htmlToMarkdown(editor.getHTML())}`;
    downloadTextFile(`${safeFilename(title)}.md`, md, "text/markdown");
  }

  function exportPdf() {
    if (!editor) return;
    printDocument(title, editor.getHTML());
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={flush}
          disabled={!editable}
          aria-label="Document title"
          className="min-w-0 flex-1 bg-transparent text-2xl font-semibold outline-none disabled:cursor-default"
          placeholder="Untitled document"
        />
        <div className="flex items-center gap-2">
          {role === "OWNER" && (
            <button
              onClick={toggleStar}
              className="btn btn-secondary btn-icon"
              aria-label={starred ? "Unstar" : "Star"}
              title={starred ? "Unstar" : "Star"}
              style={{ color: starred ? "#f59e0b" : undefined }}
            >
              {starred ? "★" : "☆"}
            </button>
          )}
          <ExportMenu onMarkdown={exportMarkdown} onPdf={exportPdf} />
          {role === "OWNER" && (
            <button onClick={() => setShareOpen(true)} className="btn btn-primary">
              Share
            </button>
          )}
        </div>
      </div>

      {!editable && (
        <div
          className="mb-3 rounded-lg px-4 py-2 text-sm text-[var(--muted)]"
          style={{ background: "var(--surface-2)" }}
        >
          You have view-only access to this document.
        </div>
      )}

      <div className="card overflow-hidden">
        {editable && editor && <Toolbar editor={editor} />}
        <EditorContent editor={editor} />
        <div
          className="flex items-center justify-between border-t px-4 py-2 text-xs text-[var(--muted)]"
          style={{ borderColor: "var(--border)" }}
        >
          <span>
            {words} {words === 1 ? "word" : "words"} · {chars} characters
          </span>
          <SaveIndicator status={status} editable={editable} />
        </div>
      </div>

      {role === "OWNER" && (
        <ShareDialog
          documentId={documentId}
          open={shareOpen}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function SaveIndicator({
  status,
  editable,
}: {
  status: SaveStatus;
  editable: boolean;
}) {
  if (!editable) return <span>Read only</span>;
  const map: Record<SaveStatus, string> = {
    saved: "✓ All changes saved",
    unsaved: "Unsaved changes…",
    saving: "Saving…",
    error: "Save failed — retrying on next edit",
  };
  const color = status === "error" ? "text-[var(--danger)]" : "";
  return <span className={color}>{map[status]}</span>;
}

// --- Export dropdown -----------------------------------------------------

function ExportMenu({
  onMarkdown,
  onPdf,
}: {
  onMarkdown: () => void;
  onPdf: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="btn btn-secondary">
        Export <span aria-hidden>▾</span>
      </button>
      {open && (
        <>
          <button
            className="fixed inset-0 z-30 cursor-default"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
          />
          <div
            className="card absolute right-0 z-40 mt-1 w-44 overflow-hidden p-1"
            style={{ boxShadow: "var(--shadow-lg)" }}
          >
            <MenuItem
              onClick={() => {
                setOpen(false);
                onMarkdown();
              }}
            >
              Download Markdown
            </MenuItem>
            <MenuItem
              onClick={() => {
                setOpen(false);
                onPdf();
              }}
            >
              Print / Save as PDF
            </MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="block w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-[var(--surface-2)]"
    >
      {children}
    </button>
  );
}

// --- Toolbar -------------------------------------------------------------

function Toolbar({ editor }: { editor: TiptapEditor }) {
  return (
    <div
      className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
    >
      <Btn
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
        label="Bold"
      >
        <span className="font-bold">B</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
        label="Italic"
      >
        <span className="italic">I</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
        label="Underline"
      >
        <span className="underline">U</span>
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
        label="Strikethrough"
      >
        <span className="line-through">S</span>
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
        label="Heading 1"
      >
        H1
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
        label="Heading 2"
      >
        H2
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive("heading", { level: 3 })}
        label="Heading 3"
      >
        H3
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
        label="Bullet list"
      >
        • List
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
        label="Numbered list"
      >
        1. List
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
        label="Quote"
      >
        &ldquo; Quote
      </Btn>

      <Divider />

      <Btn
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        label="Undo"
      >
        ↶
      </Btn>
      <Btn
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        label="Redo"
      >
        ↷
      </Btn>
    </div>
  );
}

function Btn({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`min-w-8 rounded px-2 py-1 text-sm transition disabled:opacity-40 ${
        active ? "" : "hover:bg-[var(--surface)]"
      }`}
      style={
        active
          ? { background: "var(--accent-soft)", color: "var(--accent-soft-fg)" }
          : { color: "var(--foreground)" }
      }
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px" style={{ background: "var(--border)" }} />;
}
