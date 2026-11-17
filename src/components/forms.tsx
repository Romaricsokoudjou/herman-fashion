"use client";

import { createContext, useActionState, useContext, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { initialState, type FormState } from "@/lib/form-state";

const Ctx = createContext<FormState>(initialState);
export const FormCtx = Ctx;

export function SubmitButton({ children, className = "btn-primary", pendingLabel = "Veuillez patienter…" }: { children: ReactNode; className?: string; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

export function ActionForm({
  action,
  children,
  className = "space-y-5",
  resetOnSuccess = false,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialState);
  return (
    <Ctx.Provider value={state}>
      <form action={formAction} className={className} noValidate key={resetOnSuccess && state.ok ? "done" : "form"}>
        {state.error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{state.error}</div>
        )}
        {state.ok && state.message && (
          <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">{state.message}</div>
        )}
        {children}
      </form>
    </Ctx.Provider>
  );
}

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  defaultValue?: string;
  hint?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
};

export function Field({ name, label, type = "text", required, autoComplete, placeholder, defaultValue, hint, inputMode }: FieldProps) {
  const st = useContext(Ctx);
  const err = st.fieldErrors?.[name];
  const isSecret = type === "password";
  return (
    <div>
      <label htmlFor={name} className="label">
        {label} {required && <span className="text-brand" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        defaultValue={isSecret ? undefined : (st.values?.[name] ?? defaultValue)}
        aria-invalid={!!err}
        aria-describedby={err ? `${name}-err` : undefined}
        className={`input ${err ? "border-red-400" : ""}`}
      />
      {hint && !err && <p className="mt-1 text-xs text-anthracite/60">{hint}</p>}
      {err && <p id={`${name}-err`} className="mt-1 text-xs font-medium text-red-700">{err}</p>}
    </div>
  );
}

export function TextArea({ name, label, rows = 5, required, defaultValue }: { name: string; label: string; rows?: number; required?: boolean; defaultValue?: string }) {
  const st = useContext(Ctx);
  const err = st.fieldErrors?.[name];
  return (
    <div>
      <label htmlFor={name} className="label">{label} {required && <span className="text-brand">*</span>}</label>
      <textarea id={name} name={name} rows={rows} required={required} defaultValue={st.values?.[name] ?? defaultValue} className={`input ${err ? "border-red-400" : ""}`} />
      {err && <p className="mt-1 text-xs font-medium text-red-700">{err}</p>}
    </div>
  );
}
