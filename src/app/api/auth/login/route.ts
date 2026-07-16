import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { loginSchema } from "@/lib/validation";
import { apiError, ok, readJson, validationError } from "@/lib/http";

export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Compare against a real (or dummy) hash either way to avoid leaking whether
  // the email exists via response timing.
  const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const valid = await bcrypt.compare(password, hash);

  if (!user || !valid) {
    return apiError("Invalid email or password.", 401);
  }

  await createSession(user.id);
  return ok({ user: { id: user.id, name: user.name, email: user.email } });
}
