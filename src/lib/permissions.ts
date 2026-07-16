// Pure, framework-free authorization helpers. Kept side-effect free so they are
// trivially unit-testable and can be reused on both the server and the client.

export type AccessRole = "OWNER" | "EDITOR" | "VIEWER";

export type ShareLike = { userId: string; role: string };

export type DocumentAccessInput = {
  ownerId: string;
  shares: ShareLike[];
  userId: string | null | undefined;
};

/**
 * Resolves the effective role a user has on a document, or `null` if they have
 * no access at all. Ownership always wins over an explicit share.
 */
export function getAccessRole({
  ownerId,
  shares,
  userId,
}: DocumentAccessInput): AccessRole | null {
  if (!userId) return null;
  if (userId === ownerId) return "OWNER";

  const share = shares.find((s) => s.userId === userId);
  if (!share) return null;

  return share.role === "VIEWER" ? "VIEWER" : "EDITOR";
}

export function canView(role: AccessRole | null): boolean {
  return role !== null;
}

export function canEdit(role: AccessRole | null): boolean {
  return role === "OWNER" || role === "EDITOR";
}

export function canManageSharing(role: AccessRole | null): boolean {
  return role === "OWNER";
}

export function canDelete(role: AccessRole | null): boolean {
  return role === "OWNER";
}
