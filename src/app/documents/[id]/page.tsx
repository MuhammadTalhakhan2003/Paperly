import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents";
import { canView } from "@/lib/permissions";
import AppHeader from "@/components/AppHeader";
import Editor from "@/components/Editor";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);

  if (!doc) notFound();
  if (!canView(role)) {
    // Authenticated but not allowed — treat as not found to avoid leaking existence.
    notFound();
  }

  return (
    <>
      <AppHeader user={user} />
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--muted)] transition hover:text-[var(--foreground)]"
        >
          ← Back to documents
        </Link>
      </div>
      <Editor
        documentId={doc.id}
        initialTitle={doc.title}
        initialContent={doc.content}
        initialStarred={doc.starred}
        role={role!}
      />
    </>
  );
}
