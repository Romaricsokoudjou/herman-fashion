import type { ReactNode } from "react";

export default function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <section className="bg-beige py-14 sm:py-20">
      <div className="container-x max-w-xl">
        <div className="card p-7 sm:p-10">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-anthracite/75">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        {footer && <div className="mt-6 text-center text-sm text-anthracite">{footer}</div>}
      </div>
    </section>
  );
}
