import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Flattens a ZodError into `{ field: firstMessage }` without relying on
 *  version-specific helpers (`.issues` is stable across zod v3/v4). */
export function fieldErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function validationError(error: ZodError) {
  const fields = fieldErrors(error);
  const first = Object.values(fields)[0] ?? "Invalid request";
  return NextResponse.json({ error: first, fields }, { status: 422 });
}

/** Safely parse a JSON request body, returning null on malformed input. */
export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
