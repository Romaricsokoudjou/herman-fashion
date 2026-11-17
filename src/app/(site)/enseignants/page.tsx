import type { Metadata } from "next";
import { getTeachers } from "@/lib/data";
import { PageHero, TeacherCard } from "@/components/sections";
import { EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nos enseignants", description: "L’équipe pédagogique de Herman FASHION à Douala." };

export default async function TeachersPage() {
  const teachers = await getTeachers();
  return (
    <>
      <PageHero eyebrow="Notre équipe" title="Apprenez auprès de professionnels passionnés." />
      <section className="section">
        <div className="container-x">
          {teachers.length === 0 ? (
            <EmptyState title="La présentation de l’équipe pédagogique arrive bientôt.">
              Les fiches des enseignants (photo, spécialité, expérience) sont renseignées par l’administration et seront publiées prochainement.
            </EmptyState>
          ) : (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{teachers.map((t) => <TeacherCard key={t.id} t={t} />)}</div>
          )}
        </div>
      </section>
    </>
  );
}
