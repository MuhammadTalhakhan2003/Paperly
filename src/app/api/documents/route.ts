import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { listDocumentsForUser } from "@/lib/documents";
import { createDocumentSchema } from "@/lib/validation";
import { apiError, ok, readJson, validationError } from "@/lib/http";

// GET /api/documents — owned + shared documents for the signed-in user.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const { owned, shared } = await listDocumentsForUser(user);
  return ok({ owned, shared });
}

// POST /api/documents — create a new (empty) document owned by the user.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  const parsed = createDocumentSchema.safeParse((await readJson(request)) ?? {});
  if (!parsed.success) return validationError(parsed.error);

  const doc = await prisma.document.create({
    data: {
      title: parsed.data.title ?? "Untitled document",
      ownerId: user.id,
      content: "",
    },
    select: { id: true, title: true },
  });

  return ok({ document: doc }, 201);
}
