export type FormState = {
  ok?: boolean;
  message?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
};

export const initialState: FormState = {};

export function formValues(fd: FormData, skip: string[] = ["password", "confirmPassword", "newPassword"]) {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string" && !skip.includes(k) && !k.startsWith("$ACTION")) out[k] = v;
  return out;
}
