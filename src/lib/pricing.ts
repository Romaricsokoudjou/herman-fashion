// Calcul tarifaire pur (utilisable côté client ET serveur). Aucune donnée codée en dur :
// les montants proviennent toujours des offres enregistrées en base de données.

export type CumulRule = "undefined" | "registration_once" | "registration_each";

export type PricedItem = { trainingFee: number; registrationFee: number };

export type PriceSummary = {
  trainingTotal: number;
  registrationTotal: number;
  total: number | null; // null => validation administrative requise
  definitive: boolean;
};

export function computePrice(items: PricedItem[], rule: CumulRule): PriceSummary {
  const trainingTotal = items.reduce((s, i) => s + i.trainingFee, 0);
  if (items.length === 0) return { trainingTotal: 0, registrationTotal: 0, total: 0, definitive: true };
  if (items.length === 1) {
    const registrationTotal = items[0].registrationFee;
    return { trainingTotal, registrationTotal, total: trainingTotal + registrationTotal, definitive: true };
  }
  if (rule === "registration_each") {
    const registrationTotal = items.reduce((s, i) => s + i.registrationFee, 0);
    return { trainingTotal, registrationTotal, total: trainingTotal + registrationTotal, definitive: true };
  }
  if (rule === "registration_once") {
    const registrationTotal = Math.max(...items.map((i) => i.registrationFee));
    return { trainingTotal, registrationTotal, total: trainingTotal + registrationTotal, definitive: true };
  }
  // Règle de cumul non définie : pas de total définitif.
  const registrationTotal = items.reduce((s, i) => s + i.registrationFee, 0);
  return { trainingTotal, registrationTotal, total: null, definitive: false };
}

export function parseInstallments(s: string): number[] {
  return s
    .split(/[,;\s]+/)
    .map((x) => parseInt(x.replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function fcfa(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(n).replace(/\u202f|\u00a0/g, " ") + " FCFA";
}

export const REGISTRATION_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "En attente", tone: "amber" },
  payment_confirmed: { label: "Paiement confirmé", tone: "green" },
  payment_failed: { label: "Paiement échoué", tone: "red" },
  validated: { label: "Inscription validée", tone: "emerald" },
  to_complete: { label: "Inscription à compléter", tone: "blue" },
};

export const PAYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  initiated: { label: "Redirigé vers le paiement", tone: "slate" },
  pending_verification: { label: "En attente de vérification", tone: "amber" },
  confirmed: { label: "Paiement confirmé", tone: "green" },
  failed: { label: "Paiement échoué", tone: "red" },
};
