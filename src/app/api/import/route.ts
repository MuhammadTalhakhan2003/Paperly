import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import {
  MAX_UPLOAD_BYTES,
  SUPPORTED_EXTENSIONS,
  fileToDocument,
  isSupportedExtension,
} from "@/lib/import";
import { apiError, ok } from "@/lib/http";

// POST /api/import — upload a .txt/.md/.docx file and turn it into a new,
// editable document owned by the current user (multipart/form-data, field "file").
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return apiError("Unauthorized", 401);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("Expected a multipart form upload.", 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return apiError("No file provided.", 400);
  }
  if (!isSupportedExtension(file.name)) {
    return apiError(
      `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(", ")}.`,
      415
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return apiError("File is too large (max 5 MB).", 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let imported;
  try {
    imported = await fileToDocument(file.name, buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not read file.";
    return apiError(message, 422);
  }

  const doc = await prisma.document.create({
    data: { title: imported.title, content: imported.content, ownerId: user.id },
    select: { id: true, title: true },
  });

  return ok({ document: doc }, 201);
}
