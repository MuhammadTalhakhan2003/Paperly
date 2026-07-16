import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDocumentWithAccess } from "@/lib/documents";
import { canView } from "@/lib/permissions";
import { apiError, ok } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// POST /api/documents/:id/duplicate — copy a document the user can access into
// a new document they own ("Copy of ..."). Handy for shared docs too.
export async function POST(_request: Request, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { id } = await params;
  const { doc, role } = await getDocumentWithAccess(id, user.id);
  if (!doc) return apiError("Document not found", 404);
  if (!canView(role)) return apiError("You do not have access to this document", 403);

  const copy = await prisma.document.create({
    data: {
      title: `Copy of ${doc.title}`.slice(0, 200),
      content: doc.content,
      ownerId: user.id,
    },
    select: { id: true, title: true },
  });

  return ok({ document: copy }, 201);
}
