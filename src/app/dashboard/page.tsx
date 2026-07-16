import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listDocumentsForUser } from "@/lib/documents";
import AppHeader from "@/components/AppHeader";
import DashboardClient, { type DocRow } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { owned, shared } = await listDocumentsForUser(user);

  const toRow = (d: (typeof owned)[number]): DocRow => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt.toISOString(),
    ownerName: d.ownerName,
    role: d.role,
    starred: d.starred,
  });

  return (
    <>
      <AppHeader user={user} />
      <DashboardClient owned={owned.map(toRow)} shared={shared.map(toRow)} />
    </>
  );
}
