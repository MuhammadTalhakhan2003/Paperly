"use client";

import { useEffect, useState } from "react";

type Share = {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
};

export default function ShareDialog({
  documentId,
  open,
  onClose,
}: {
  documentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
    fetch(`/api/documents/${documentId}/shares`)
      .then((r) => r.json())
      .then((d) => setShares(d.shares ?? []))
      .catch(() => setError("Could not load collaborators"))
      .finally(() => setLoading(false));
  }, [open, documentId]);

  async function addShare(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not share");
      setShares((prev) => [
        ...prev.filter((s) => s.user.id !== data.share.user.id),
        data.share,
      ]);
      setEmail("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(shareId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/shares/${shareId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setShares((prev) => prev.filter((s) => s.id !== shareId));
    } catch {
      setError("Could not revoke access");
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--overlay)" }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md p-6"
        style={{ boxShadow: "var(--shadow-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Share document</h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={addShare} className="mb-4 space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@email.com"
            className="input"
          />
          <div className="flex gap-2">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
              className="input"
              style={{ flex: "1 1 0" }}
            >
              <option value="EDITOR">Editor — can edit</option>
              <option value="VIEWER">Viewer — read only</option>
            </select>
            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary"
              style={{ flex: "0 0 auto" }}
            >
              Share
            </button>
          </div>
        </form>

        {error && (
          <p
            className="mb-3 rounded-lg px-3 py-2 text-sm"
            style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            {error}
          </p>
        )}

        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            People with access
          </h3>
          {loading ? (
            <p className="text-sm text-[var(--muted)]">Loading…</p>
          ) : shares.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Only you can access this document. Add someone above.
            </p>
          ) : (
            <ul className="space-y-2">
              {shares.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s.user.name}</div>
                    <div className="truncate text-xs text-[var(--muted)]">
                      {s.user.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-muted">
                      {s.role === "VIEWER" ? "Viewer" : "Editor"}
                    </span>
                    <button
                      onClick={() => revoke(s.id)}
                      disabled={busy}
                      className="btn btn-danger px-2 py-1 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 text-xs text-[var(--muted)]">
          Tip: the person must have a Paperly account with that email. Editors can
          change content; viewers can only read.
        </p>
      </div>
    </div>
  );
}
