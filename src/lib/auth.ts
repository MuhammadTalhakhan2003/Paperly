import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

// Memoized per-request so multiple components/handlers in one render pass share
// a single database lookup.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  });

  return user;
});
