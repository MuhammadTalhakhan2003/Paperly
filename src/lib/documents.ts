import { prisma } from "@/lib/db";
import { getAccessRole, type AccessRole } from "@/lib/permissions";

/** Loads a document together with the current user's effective access role. */
export async function getDocumentWithAccess(
  documentId: string,
  userId: string | null
): Promise<{
  doc: Awaited<ReturnType<typeof loadDocument>>;
  role: AccessRole | null;
}> {
  const doc = await loadDocument(documentId);
  if (!doc) return { doc: null, role: null };
  const role = getAccessRole({ ownerId: doc.ownerId, shares: doc.shares, userId });
  return { doc, role };
}

function loadDocument(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: Date;
  ownerName: string;
  role: AccessRole;
  starred: boolean;
};

/** Documents the user owns, plus documents shared with them, as flat summaries. */
export async function listDocumentsForUser(user: {
  id: string;
  name: string;
}): Promise<{ owned: DocumentSummary[]; shared: DocumentSummary[] }> {
  const [ownedDocs, sharedDocs] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      orderBy: [{ starred: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, updatedAt: true, starred: true },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        owner: { select: { name: true } },
        shares: { where: { userId: user.id }, select: { role: true } },
      },
    }),
  ]);

  const owned: DocumentSummary[] = ownedDocs.map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt,
    ownerName: user.name,
    role: "OWNER",
    starred: d.starred,
  }));

  const shared: DocumentSummary[] = sharedDocs.map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt,
    ownerName: d.owner.name,
    role: d.shares[0]?.role === "VIEWER" ? "VIEWER" : "EDITOR",
    starred: false,
  }));

  return { owned, shared };
}
