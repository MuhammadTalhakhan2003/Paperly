import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents";
import { canManageSharing } from "@/lib/permissions";
import { shareSchema } from "@/lib/validation";
import { apiError, ok, readJson, validationError } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/documents/:id/shares — owner lists collaborators.
export async function GET(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);
  if (!doc) return apiError("Document not found", 404);
  if (!canManageSharing(role)) return apiError("Only the owner can view sharing", 403);

  const shares = doc.shares.map((s) => ({
    id: s.id,
    role: s.role,
    user: s.user,
  }));
  return ok({ shares });
}

// POST /api/documents/:id/shares — owner grants access to another user by email.
export async function POST(request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);
  if (!doc) return apiError("Document not found", 404);
  if (!canManageSharing(role)) return apiError("Only the owner can share this document", 403);

  const parsed = shareSchema.safeParse(await readJson(request));
  if (!parsed.success) return validationError(parsed.error);

  const { email, role: shareRole } = parsed.data;

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) {
    return apiError("No Paperly user with that email. Ask them to sign up first.", 404);
  }
  if (target.id === doc.ownerId) {
    return apiError("You already own this document.", 400);
  }

  // Idempotent: sharing again updates the role instead of erroring.
  const share = await prisma.share.upsert({
    where: { documentId_userId: { documentId: id, userId: target.id } },
    update: { role: shareRole },
    create: { documentId: id, userId: target.id, role: shareRole },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return ok({ share: { id: share.id, role: share.role, user: share.user } }, 201);
}
