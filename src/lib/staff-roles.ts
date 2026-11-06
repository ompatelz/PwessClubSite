// Staff roles, shared by server pages and browser components (no server imports here).

export type StaffRole = "convenor" | "editor" | "writer";

export const ROLE_LABELS: Record<StaffRole, string> = {
  convenor: "Convenor",
  editor: "Editor",
  writer: "Writer",
};

export const canPublish = (role: StaffRole) => role === "convenor" || role === "editor";
