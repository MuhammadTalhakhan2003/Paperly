import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents";
import { canDelete, canEdit, canView } from "@/lib/permissions";
import { sanitizeRichText } from "@/lib/sanitize";
import { updateDocumentSchema } from "@/lib/validation";
import { apiError, ok, readJson, validationError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/documents/:id — read a document the user can access.
export async function GET(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);
  if (!doc) return apiError("Document not found", 404);
  if (!canView(role)) return apiError("You do not have access to this document", 403);

  return ok({
    document: { id: doc.id, title: doc.title, content: doc.content, updatedAt: doc.updatedAt },
    role,
  });
}

// PATCH /api/documents/:id — rename and/or autosave content.
export async function PATCH(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);
  if (!doc) return apiError("Document not found", 404);
  if (!canEdit(role)) return apiError("You do not have permission to edit this document", 403);

  const parsed = updateDocumentSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const data: { title?: string; content?: string; starred?: boolean } = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  // Sanitize on the server so no untrusted HTML is ever persisted.
  if (parsed.data.content !== undefined) data.content = sanitizeRichText(parsed.data.content);
  // Starring is an owner-only, personal flag.
  if (parsed.data.starred !== undefined && role === "OWNER") {
    data.starred = parsed.data.starred;
  }

  const updated = await prisma.document.update({
    where: { id },
    data,
    select: { id: true, title: true, updatedAt: true, starred: true },
  });

  return ok({ document: updated });
}

// DELETE /api/documents/:id — owner only.
export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);
  if (!doc) return apiError("Document not found", 404);
  if (!canDelete(role)) return apiError("Only the owner can delete this document", 403);

  await prisma.document.delete({ where: { id } });
  return ok({ success: true });
}
