"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { formatRelative } from "@/lib/format";

export type DocRow = {
  id: string;
  title: string;
  updatedAt: string;
  ownerName: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  starred: boolean;
};

const ACCEPT = ".txt,.md,.markdown,.docx";
type Tab = "owned" | "shared" | "starred";

export default function DashboardClient({
  owned,
  shared,
}: {
  owned: DocRow[];
  shared: DocRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("owned");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function createDocument() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/documents", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create document");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Import failed");
      setBusy(false);
    }
  }

  async function deleteDocument(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not delete");
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStar(id: string, next: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setMessage("Could not update star");
    } finally {
      setBusy(false);
    }
  }

  async function duplicate(id: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/documents/${id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not duplicate");
      router.push(`/documents/${data.document.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  }

  const starredCount = owned.filter((d) => d.starred).length;
  const source =
    tab === "owned" ? owned : tab === "shared" ? shared : owned.filter((d) => d.starred);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? source.filter((d) => d.title.toLowerCase().includes(q)) : source;
  }, [source, query]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your documents</h1>
          <p className="text-sm text-[var(--muted)]">
            Create, import, star, duplicate, and share rich-text documents.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => fileInput.current?.click()} disabled={busy} className="btn btn-secondary">
            <span aria-hidden>↑</span> Import
          </button>
          <input ref={fileInput} type="file" accept={ACCEPT} onChange={handleUpload} className="hidden" />
          <button onClick={createDocument} disabled={busy} className="btn btn-primary">
            <span aria-hidden>+</span> New document
          </button>
        </div>
      </div>

      {message && (
        <p className="mb-4 rounded-lg px-3 py-2 text-sm" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          {message}
        </p>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
          <TabButton active={tab === "owned"} onClick={() => setTab("owned")}>
            My documents ({owned.length})
          </TabButton>
          <TabButton active={tab === "shared"} onClick={() => setTab("shared")}>
            Shared with me ({shared.length})
          </TabButton>
          <TabButton active={tab === "starred"} onClick={() => setTab("starred")}>
            ★ Starred ({starredCount})
          </TabButton>
        </div>
        <div className="relative w-full sm:w-64">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title…"
            className="input pl-8"
            aria-label="Search documents"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card p-12 text-center" style={{ boxShadow: "none", borderStyle: "dashed" }}>
          <div className="mb-2 text-3xl">🗎</div>
          <p className="text-sm text-[var(--muted)]">
            {query
              ? "No documents match your search."
              : tab === "owned"
                ? "No documents yet. Create one or import a file to get started."
                : tab === "starred"
                  ? "No starred documents. Tap the ★ on a document to pin it here."
                  : "Nothing shared with you yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              showOwner={tab === "shared"}
              busy={busy}
              onStar={toggleStar}
              onDuplicate={duplicate}
              onDelete={deleteDocument}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DocCard({
  doc,
  showOwner,
  busy,
  onStar,
  onDuplicate,
  onDelete,
}: {
  doc: DocRow;
  showOwner: boolean;
  busy: boolean;
  onStar: (id: string, next: boolean) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const isOwner = doc.role === "OWNER";
  return (
    <div className="card flex flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2 flex items-start justify-between gap-2">
        <RoleBadge role={doc.role} />
        {isOwner && (
          <button
            onClick={() => onStar(doc.id, !doc.starred)}
            disabled={busy}
            aria-label={doc.starred ? "Unstar" : "Star"}
            title={doc.starred ? "Unstar" : "Star"}
            className="rounded p-1 text-lg leading-none transition hover:bg-[var(--surface-2)]"
            style={{ color: doc.starred ? "#f59e0b" : "var(--muted)" }}
          >
            {doc.starred ? "★" : "☆"}
          </button>
        )}
      </div>

      <Link href={`/documents/${doc.id}`} className="flex-1">
        <div className="mb-1 line-clamp-2 font-medium">{doc.title}</div>
        <div className="text-xs text-[var(--muted)]">
          {showOwner ? `Owned by ${doc.ownerName} · ` : ""}
          Updated {formatRelative(doc.updatedAt)}
        </div>
      </Link>

      <div className="mt-3 flex items-center gap-1 border-t pt-2 text-xs" style={{ borderColor: "var(--border)" }}>
        <Link href={`/documents/${doc.id}`} className="btn btn-ghost px-2 py-1 text-xs">
          Open
        </Link>
        <button onClick={() => onDuplicate(doc.id)} disabled={busy} className="btn btn-ghost px-2 py-1 text-xs">
          Duplicate
        </button>
        {isOwner && (
          <button
            onClick={() => onDelete(doc.id, doc.title)}
            disabled={busy}
            className="btn btn-danger ml-auto px-2 py-1 text-xs"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-[var(--accent)] text-[var(--accent)]"
          : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function RoleBadge({ role }: { role: DocRow["role"] }) {
  const cls =
    role === "OWNER" ? "badge-accent" : role === "EDITOR" ? "badge-success" : "badge-muted";
  const label = { OWNER: "Owner", EDITOR: "Editor", VIEWER: "Viewer" }[role];
  return <span className={`badge ${cls}`}>{label}</span>;
}
