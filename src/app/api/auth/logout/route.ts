import { deleteSession } from "@/lib/session";
import { ok } from "@/lib/http";

export async function POST() {
  await deleteSession();
  return ok({ success: true });
}
