"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { computePrice, fcfa, parseInstallments, type CumulRule } from "@/lib/pricing";
import { createRegistrationAction } from "@/app/actions/registration";
import { initialState } from "@/lib/form-state";

type Offer = { id: string; durationLabel: string; trainingFee: number; registrationFee: number; diploma: string; installments: string };
type Formation = { id: string; slug: string; name: string; summary: string; imageUrl: string; offers: Offer[] };
type Center = { id: string; name: string; address: string };

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={disabled || pending} className="btn-primary w-full">{pending ? "Enregistrement…" : "Confirmer et continuer vers le paiement"}</button>;
}

export default function RegistrationWizard({
  formations, centers, rule, candidate, preselect,
}: { formations: Formation[]; centers: Center[]; rule: CumulRule; candidate: string; preselect: string }) {
  const [sel, setSel] = useState<Record<string, string>>(() => {
    const f = formations.find((x) => x.slug === preselect);
    return f ? { [f.id]: f.offers.length === 1 ? f.offers[0].id : "" } : {};
  });
  const [centerId, setCenterId] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [state, action] = useActionState(createRegistrationAction, initialState);

  const chosen = useMemo(
    () => formations.filter((f) => f.id in sel).map((f) => ({ f, o: f.offers.find((o) => o.id === sel[f.id]) })),
    [formations, sel],
  );
  const complete = chosen.length > 0 && chosen.every((c) => c.o);
  const price = computePrice(chosen.filter((c) => c.o).map((c) => ({ trainingFee: c.o!.trainingFee, registrationFee: c.o!.registrationFee })), rule);
  const center = centers.find((c) => c.id === centerId);
  const selections = JSON.stringify(chosen.filter((c) => c.o).map((c) => ({ formationId: c.f.id, offerId: c.o!.id })));

  function toggle(f: Formation) {
    setSel((s) => {
      const n = { ...s };
      if (f.id in n) delete n[f.id];
      else n[f.id] = f.offers.length === 1 ? f.offers[0].id : "";
      return n;
    });
  }

  return (
    <form action={action} className="grid gap-10 lg:grid-cols-[1fr_400px]">
      <input type="hidden" name="selections" value={selections} />
      <input type="hidden" name="centerId" value={centerId} />
      <div className="space-y-12">
        <section aria-labelledby="step-formations">
          <h2 id="step-formations" className="text-2xl font-semibold"><span className="mr-2 text-brand">1.</span>Choisissez une ou plusieurs formations</h2>
          <p className="mt-2 text-sm text-anthracite/70">Cochez les formations qui vous intéressent, puis sélectionnez la durée de chacune.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {formations.map((f) => {
              const on = f.id in sel;
              const disabled = f.offers.length === 0;
              return (
                <div key={f.id} className={`overflow-hidden rounded-2xl border-2 bg-white transition ${on ? "border-brand shadow-lg" : "border-ink/10"} ${disabled ? "opacity-60" : ""}`}>
                  <label className="flex cursor-pointer gap-4 p-4">
                    <input type="checkbox" checked={on} disabled={disabled} onChange={() => toggle(f)} className="mt-1 h-5 w-5 accent-[#f26a1b]" aria-label={`Sélectionner ${f.name}`} />
                    {f.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.imageUrl} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                    )}
                    <span>
                      <span className="block font-serif text-lg font-semibold leading-tight">{f.name}</span>
                      <span className="mt-1 block text-xs text-anthracite/70">{disabled ? "Aucune durée disponible actuellement" : f.summary}</span>
                    </span>
                  </label>
                  {on && (
                    <fieldset className="border-t border-ink/10 bg-beige/60 p-4">
                      <legend className="sr-only">Durée pour {f.name}</legend>
                      <div className="space-y-2">
                        {f.offers.map((o) => (
                          <label key={o.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 text-sm ${sel[f.id] === o.id ? "border-brand ring-2 ring-brand/20" : "border-ink/10"}`}>
                            <span className="flex items-center gap-2">
                              <input type="radio" name={`d-${f.id}`} checked={sel[f.id] === o.id} onChange={() => setSel((s) => ({ ...s, [f.id]: o.id }))} className="accent-[#f26a1b]" />
                              <strong>{o.durationLabel}</strong>{o.diploma && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] text-white">{o.diploma}</span>}
                            </span>
                            <span className="text-xs text-anthracite/80">{fcfa(o.trainingFee)}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="step-center">
          <h2 id="step-center" className="text-2xl font-semibold"><span className="mr-2 text-brand">2.</span>Choisissez votre centre</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {centers.map((c) => (
              <label key={c.id} className={`cursor-pointer rounded-2xl border-2 bg-white p-5 transition ${centerId === c.id ? "border-brand shadow-lg" : "border-ink/10"}`}>
                <input type="radio" name="center" className="mr-2 accent-[#f26a1b]" checked={centerId === c.id} onChange={() => setCenterId(c.id)} />
                <strong className="font-serif text-lg">{c.name}</strong>
                <span className="mt-2 block text-sm text-anthracite/75">{c.address}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-32 lg:self-start" aria-labelledby="recap">
        <div className="card p-6">
          <h2 id="recap" className="text-2xl font-semibold"><span className="mr-2 text-brand">3.</span>Récapitulatif</h2>
          <p className="mt-2 text-sm text-anthracite/70">Candidat : <strong className="text-ink">{candidate}</strong></p>
          <p className="mt-1 text-sm text-anthracite/70">Centre : <strong className="text-ink">{center?.name ?? "à choisir"}</strong></p>

          {chosen.length === 0 ? (
            <p className="mt-5 rounded-xl bg-beige p-4 text-sm">Aucune formation sélectionnée.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {chosen.map(({ f, o }) => (
                <li key={f.id} className="rounded-xl bg-beige p-4 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <strong>{f.name}</strong>
                    <button type="button" onClick={() => toggle(f)} className="text-xs text-red-700 underline" aria-label={`Retirer ${f.name}`}>Retirer</button>
                  </div>
                  {o ? (
                    <>
                      <p className="mt-1 text-anthracite/80">{o.durationLabel}{o.diploma && ` · ${o.diploma}`}</p>
                      <p className="mt-2 flex justify-between"><span>Frais de formation</span><span>{fcfa(o.trainingFee)}</span></p>
                      <p className="flex justify-between"><span>Inscription et polo</span><span>{fcfa(o.registrationFee)}</span></p>
                      {parseInstallments(o.installments).length > 0 && (
                        <p className="mt-1 text-xs text-anthracite/70">Tranches : {parseInstallments(o.installments).map((x) => fcfa(x)).join(" + ")}</p>
                      )}
                    </>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-brand">Choisissez une durée.</p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {complete && (
            <div className="mt-5 border-t border-ink/10 pt-4 text-sm">
              <p className="flex justify-between"><span>Total frais de formation</span><strong>{fcfa(price.trainingTotal)}</strong></p>
              <p className="flex justify-between"><span>Total inscription et polo</span><strong>{fcfa(price.registrationTotal)}</strong></p>
              {price.definitive ? (
                <p className="mt-3 flex justify-between text-lg"><span className="font-semibold">Montant total</span><strong className="text-brand">{fcfa(price.total)}</strong></p>
              ) : (
                <p className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                  Pour plusieurs formations, la règle de cumul des frais n’est pas encore définie : le montant total définitif sera <strong>validé par l’administration</strong> avant le paiement. Aucun total n’est affiché pour éviter toute erreur de facturation.
                </p>
              )}
            </div>
          )}

          {state.error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}

          <label className="mt-5 flex items-start gap-3 text-sm">
            <input type="checkbox" name="confirm" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#f26a1b]" />
            <span>Je confirme l’exactitude des informations ci-dessus et j’accepte les <a href="/informations-legales#conditions-inscription" target="_blank" className="underline">conditions d’inscription</a>.</span>
          </label>
          <div className="mt-5">
            <Submit disabled={!complete || !centerId || !confirm} />
            {(!complete || !centerId) && <p className="mt-2 text-xs text-anthracite/60">Sélectionnez au moins une formation avec sa durée, puis votre centre.</p>}
          </div>
        </div>
      </aside>
    </form>
  );
}
