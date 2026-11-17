import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { ENTITIES } from "@/lib/admin-entities";
import EntityManager from "@/components/admin/EntityManager";

export const dynamic = "force-dynamic";
const ALLOWED = ["enseignants", "temoignages", "actualites", "galerie", "centres"];

export default async function AdminContent({ params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  if (!ALLOWED.includes(entity)) notFound();
  await requireStaff(ENTITIES[entity].perm);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">{ENTITIES[entity].title}</h1>
      <EntityManager entityKey={entity} back={`/admin/contenus/${entity}`} />
    </div>
  );
}
