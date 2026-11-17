export type Permission =
  | "users"
  | "registrations"
  | "finance"
  | "formations"
  | "content"
  | "ai"
  | "settings"
  | "admins"
  | "audit";

export const ROLES: Record<string, { label: string; permissions: Permission[] }> = {
  learner: { label: "Apprenant", permissions: [] },
  super_admin: {
    label: "Super administrateur",
    permissions: ["users", "registrations", "finance", "formations", "content", "ai", "settings", "admins", "audit"],
  },
  admin: {
    label: "Administrateur",
    permissions: ["users", "registrations", "finance", "formations", "content", "ai", "settings"],
  },
  registrations_manager: { label: "Gestionnaire des inscriptions", permissions: ["users", "registrations"] },
  finance_manager: { label: "Gestionnaire financier", permissions: ["finance"] },
  content_manager: { label: "Gestionnaire de contenu", permissions: ["content", "ai"] },
};

export const ADMIN_ROLES = Object.keys(ROLES).filter((r) => r !== "learner");

export function can(role: string, perm: Permission): boolean {
  return ROLES[role]?.permissions.includes(perm) ?? false;
}

export function isStaff(role: string): boolean {
  return ADMIN_ROLES.includes(role);
}
