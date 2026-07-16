import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/session";
import { signupSchema } from "@/lib/validation";
import { apiError, ok, readJson, validationError } from "@/lib/http";

export async function POST(request: Request) {
  const body = await readJson(request);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return apiError("An account with this email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true, name: true, email: true },
  });

  await createSession(user.id);
  return ok({ user }, 201);
}
