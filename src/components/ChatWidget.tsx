"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WhatsAppIcon } from "@/components/ui";

type Msg = { role: "user" | "assistant"; content: string; links?: { label: string; href: string }[] };

const QUICK = [
  "Quelles formations proposez-vous ?",
  "Quels sont les tarifs ?",
  "Où sont vos centres ?",
  "Comment m’inscrire ?",
  "Comment payer ?",
];

function newKey() {
  return crypto.randomUUID();
}

export default function ChatWidget({ whatsapp }: { whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [handoffMsg, setHandoffMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || key) return;
    let k = localStorage.getItem("hf_chat_key");
    if (!k) {
      k = newKey();
      localStorage.setItem("hf_chat_key", k);
    }
    setKey(k);
    fetch(`/api/chat?key=${k}`)
      .then((r) => r.json())
      .then((d: { messages?: Msg[] }) => setMsgs(d.messages ?? []))
      .catch(() => {});
  }, [open, key]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, busy, handoff]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy || !key) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: message }]);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, message }) });
      const d = (await res.json()) as { reply?: string; links?: Msg["links"]; handoff?: boolean; error?: string };
      setMsgs((m) => [...m, { role: "assistant", content: d.reply ?? d.error ?? "Une erreur est survenue.", links: d.links }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Connexion impossible pour le moment. Vous pouvez nous écrire sur WhatsApp." }]);
    } finally {
      setBusy(false);
    }
  }

  async function submitHandoff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, action: "handoff", contact: fd.get("contact"), note: fd.get("note") }) });
    const d = (await res.json()) as { message?: string; error?: string };
    setHandoffMsg(d.message ?? d.error ?? "");
    if (res.ok) setTimeout(() => setHandoff(false), 2500);
  }

  function reset() {
    const k = newKey();
    localStorage.setItem("hf_chat_key", k);
    setKey(k);
    setMsgs([]);
    setHandoff(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fermer HERMAN AI ASSISTANT" : "Ouvrir HERMAN AI ASSISTANT"}
        className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 rounded-full bg-ink pl-4 pr-5 text-sm font-semibold text-white shadow-2xl transition hover:-translate-y-0.5 hover:bg-anthracite"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-base">✦</span>
        <span className="hidden sm:inline">{open ? "Fermer" : "HERMAN AI"}</span>
      </button>

      {open && (
        <section aria-label="HERMAN AI ASSISTANT" className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(640px,calc(100vh-8rem))] flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-2xl sm:inset-x-auto sm:right-5 sm:w-[390px]">
          <header className="flex items-center justify-between bg-ink px-5 py-4 text-white">
            <div>
              <p className="font-serif text-base font-semibold">HERMAN AI ASSISTANT</p>
              <p className="text-xs text-white/60">Disponible 24 h/24 · 7 j/7</p>
            </div>
            <button type="button" onClick={reset} className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10">Nouvelle conversation</button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-beige/50 px-4 py-4" aria-live="polite">
            <Bubble role="assistant">
              Bonjour et bienvenue chez Herman FASHION ! Je suis votre assistant : formations, durées, tarifs officiels, centres, inscription… Comment puis-je vous aider ?
            </Bubble>
            {msgs.map((m, i) => (
              <Bubble key={i} role={m.role}>
                {m.content}
                {m.links && m.links.length > 0 && (
                  <span className="mt-3 flex flex-wrap gap-2">
                    {m.links.map((l) =>
                      l.href.startsWith("http") ? (
                        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">{l.label}</a>
                      ) : (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white">{l.label}</Link>
                      ),
                    )}
                  </span>
                )}
              </Bubble>
            ))}
            {busy && <Bubble role="assistant">…</Bubble>}
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK.map((q) => (
                  <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-brand/40 bg-white px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-soft">{q}</button>
                ))}
              </div>
            )}
            {handoff && (
              <form onSubmit={submitHandoff} className="space-y-2 rounded-2xl border border-ink/10 bg-white p-4">
                <p className="text-sm font-semibold">Parler à un conseiller</p>
                <input name="contact" required placeholder="Votre téléphone ou e-mail" className="input py-2" />
                <textarea name="note" rows={2} placeholder="Votre question (facultatif)" className="input py-2" />
                <button className="btn-primary btn-sm w-full" type="submit">Être rappelé</button>
                {handoffMsg && <p className="text-xs text-anthracite">{handoffMsg}</p>}
              </form>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-ink/5 bg-white p-3">
            <div className="mb-2 flex gap-2">
              <button type="button" onClick={() => setHandoff(true)} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium hover:border-brand hover:text-brand">Conseiller humain</button>
              <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-green-600/40 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"><WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp</a>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={800} placeholder="Posez votre question…" aria-label="Votre message" className="input py-2.5" />
              <button type="submit" disabled={busy || !input.trim()} className="btn-primary px-4 py-2.5">Envoyer</button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[88%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${role === "user" ? "rounded-br-sm bg-brand text-white" : "rounded-bl-sm bg-white text-ink shadow-sm"}`}>
        {children}
      </div>
    </div>
  );
}
