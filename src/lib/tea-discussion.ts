// Shared policy and plain-data helpers. No database or identity code in this file.
export const TEA_RULES_VERSION = "2026-11-24";
export const TEA_RULES = [
  { title: "Discuss ideas, respect people", text: "No harassment, hate, threats, sexual targeting, or calls to pile on someone." },
  { title: "Keep private people private", text: "No phone numbers, addresses, private messages, identifying student details, or photos shared without consent." },
  { title: "Do not turn rumours into allegations", text: "Do not post unverified accusations about identifiable people. Send sensitive concerns privately to the Press Club through Contact." },
  { title: "Keep it relevant and original", text: "Campus conversation is welcome. Spam, impersonation, repeated posts, and advertising are not." },
  { title: "Every contribution is reviewed", text: "Posts and member replies appear only after editorial approval. Editors may edit or decline submissions. Report a concern instead of repeating harmful material." },
  { title: "Know what is public", text: "Tea posts have no public author. Member replies show the member's profile byline. Account emails and reports stay in the private review desk; infrastructure operators may retain request logs." },
] as const;

export const REPORT_REASONS = ["Harassment or hate", "Private information", "Unverified allegation", "Spam or impersonation", "Other rule violation"] as const;
export type ReportReason = typeof REPORT_REASONS[number];
export const isUuid = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const acceptsTeaRules = (input: Record<string, unknown>) => input.agreed === true && input.rulesVersion === TEA_RULES_VERSION;
export function cleanReply(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length >= 2 && text.length <= 2000 ? text : null;
}

export type PublicTeaComment = {
  id: string; parent_id: string | null; author_name: string; body: string; published_at: string; depth: number;
};
export type TeaCommentNode = PublicTeaComment & { children: TeaCommentNode[] };
// Orphans are intentionally hidden: removing a parent must not expose its replies.
export function commentTree(rows: PublicTeaComment[]): TeaCommentNode[] {
  const nodes = new Map(rows.map(row => [row.id, { ...row, children: [] as TeaCommentNode[] }]));
  const roots: TeaCommentNode[] = [];
  for (const node of nodes.values()) {
    if (!node.parent_id && node.depth === 0) roots.push(node);
    else {
      const parent = node.parent_id ? nodes.get(node.parent_id) : undefined;
      if (parent && node.depth === parent.depth + 1 && node.depth <= 4) parent.children.push(node);
    }
  }
  return roots;
}
