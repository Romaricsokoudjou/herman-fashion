import type { ReactNode } from "react";

type IconProps = { className?: string };

export const FacebookIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M13.5 22v-8.2h2.8l.5-3.3h-3.3V8.4c0-.9.4-1.7 1.8-1.7H17V3.8c-.3 0-1.3-.2-2.5-.2-2.6 0-4.3 1.6-4.3 4.4v2.5H7.4v3.3h2.8V22h3.3z" />
  </svg>
);
export const TikTokIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.6 3c.3 2.3 1.6 3.7 3.9 3.9v3.1c-1.4.1-2.6-.3-3.9-1.1v5.8c0 7.4-8 9.7-11.200 4.400-2-3.300-.8-8.700 5.600-8.900v3.200c-.5.100-1 .2-1.400.4-1.300.4-2 1.600-1.700 3 .5 2.800 5.500 3.600 5.100-1.800V3h3.600z" />
  </svg>
);
export const WhatsAppIcon = ({ className = "h-6 w-6" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.600 15.100L2 22l5-1.300A10 10 0 1 0 12 2zm0 18.200c-1.500 0-2.900-.4-4.100-1.200l-.3-.2-3 .8.8-2.900-.2-.3A8.200 8.200 0 1 1 12 20.200zm4.500-6.100c-.2-.1-1.500-.7-1.700-.8-.2-.1-.4-.1-.6.100l-.8 1c-.1.200-.3.200-.5.100-1.400-.7-2.300-1.200-3.200-2.700-.2-.3.200-.3.700-1.200.1-.2 0-.3 0-.5l-.8-1.800c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.100-.7.300-.7.700-1 1.500-1 2.400.1 1 .5 1.900 1.100 2.700 1.100 1.600 2.500 2.800 4.200 3.500 1.600.6 2.100.6 2.900.5.800-.1 1.500-.6 1.800-1.300.1-.3.100-.6 0-.7-.1-.1-.2-.2-.4-.3z" />
  </svg>
);
export const PinIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M12 21s7-6.100 7-11.500A7 7 0 0 0 5 9.500C5 14.900 12 21 12 21z" /><circle cx="12" cy="9.500" r="2.500" />
  </svg>
);
export const PhoneIcon = ({ className = "h-5 w-5" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
  </svg>
);
export const CheckIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M5 12.500l4.500 4.500L19 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const ArrowIcon = ({ className = "h-4 w-4" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
export const PlayIcon = ({ className = "h-7 w-7" }: IconProps) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>
);

export function SectionTitle({
  eyebrow,
  title,
  children,
  center = false,
  light = false,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={`mb-12 max-w-3xl ${center ? "mx-auto text-center" : ""}`}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2 className={`text-3xl font-semibold leading-tight sm:text-4xl ${light ? "text-white" : "text-ink"}`}>{title}</h2>
      {children && <div className={`mt-4 text-base leading-relaxed ${light ? "text-white/75" : "text-anthracite/80"}`}>{children}</div>}
    </div>
  );
}

const TONES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800",
  green: "bg-green-100 text-green-800",
  emerald: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  slate: "bg-slate-100 text-slate-700",
};
export function StatusBadge({ label, tone }: { label: string; tone: string }) {
  return <span className={`badge ${TONES[tone] ?? TONES.slate}`}>{label}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/20 bg-beige/60 px-6 py-12 text-center">
      <p className="font-serif text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-xl text-sm text-anthracite/75">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "error" | "success"; children: ReactNode }) {
  const cls = {
    info: "border-blue-200 bg-blue-50 text-blue-900",
    warn: "border-amber-300 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-900",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  );
}
