import type { ReactNode } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import EspaceNav from "@/components/EspaceNav";

export const dynamic = "force-dynamic";

export default async function EspaceLayout({ children }: { children: ReactNode }) {
  const user = await requireUser("/espace");
  return (
    <section className="bg-beige py-10 sm:py-14">
      <div className="container-x">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Mon espace personnel</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Bonjour {user.firstName}</h1>
          </div>
          <Link href="/inscription" className="btn-primary">Nouvelle inscription</Link>
        </div>
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <EspaceNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </section>
  );
}
