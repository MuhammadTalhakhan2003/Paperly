import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents";
import { canManageSharing } from "@/lib/permissions";
import { apiError, ok } from "@/lib/http";

type Ctx = { params: Promise<{ id: string; shareId: string }> };

// DELETE /api/documents/:id/shares/:shareId — owner revokes a collaborator.
export async function DELETE(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id, shareId } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);
  if (!doc) return apiError("Document not found", 404);
  if (!canManageSharing(role)) return apiError("Only the owner can manage sharing", 403);

  const share = doc.shares.find((s) => s.id === shareId);
  if (!share) return apiError("Share not found", 404);

  await prisma.share.delete({ where: { id: shareId } });
  return ok({ success: true });
}
