"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { ROLE_LABELS, type StaffRole } from "@/lib/staff-roles";

type Member = {
  email: string;
  name: string | null;
  pen_name: string | null;
  role: StaffRole;
  active: boolean;
  added_by: string | null;
  created_at: string;
  profile_completed_at: string | null;
};

// What to call a member before they have set their own name.
const label = (member: Member) => member.name ?? member.email;

const ROLE_HELP: Record<StaffRole, string> = {
  convenor: "Manages the team; can do everything an editor can.",
  editor: "Publishes and edits any post; adds and removes editions.",
  writer: "Writes posts and submits them for review.",
};

function friendly(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "That address is already on the team.";
  if (error.code === "23514" && /convenor/i.test(error.message ?? "")) return "The Press Club needs at least one active convenor. Make someone else convenor first.";
  if (error.code === "23514") return "Use a @dau.ac.in address. A name, if you add one, needs at least 2 characters.";
  if (error.code === "42501" || /row-level security/i.test(error.message ?? "")) return "Only the convenor can change the team.";
  return "That didn't save. Check your connection and try again.";
}

export default function MembersManager({ members, isConvenor, me }: { members: Member[]; isConvenor: boolean; me: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<StaffRole>("writer");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);

  async function run(action: () => PromiseLike<{ error: { code?: string; message?: string } | null; count?: number | null }>, done: string) {
    setBusy(true);
    setError("");
    setNotice("");
    const { error: actionError, count } = await action();
    setBusy(false);
    if (actionError || count === 0) {
      setError(actionError ? friendly(actionError) : "Only the convenor can change the team.");
      return false;
    }
    setNotice(done);
    router.refresh();
    return true;
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A bare student ID is accepted and turned into their DAU address.
    const typed = email.trim().toLowerCase();
    const address = /^\d{6,12}$/.test(typed) ? `${typed}@dau.ac.in` : typed;
    if (!/^[a-z0-9._%+-]+@dau\.ac\.in$/.test(address)) return setError("Use the member's @dau.ac.in address or student ID.");
    const cleanName = name.trim().replace(/\s+/g, " ");
    if (cleanName && cleanName.length < 2) return setError("A name needs at least 2 characters, or leave it empty.");
    const ok = await run(
      () => getBrowserSupabase().from("staff_members").insert({ email: address, name: cleanName || null, role }),
      `${cleanName || address} can now sign in with ${address}.`,
    );
    if (ok) { setEmail(""); setName(""); setRole("writer"); }
  }

  const supabase = () => getBrowserSupabase().from("staff_members");

  return (
    <div className="members-manager">
      {isConvenor && (
        <form className="staff-card" onSubmit={add}>
          <h2>Add a member</h2>
          <fieldset disabled={busy}>
            <div className="staff-row">
              <div>
                <label htmlFor="member-email">DAU email or student ID</label>
                <input id="member-email" inputMode="email" autoComplete="off" placeholder="202501082 or name@dau.ac.in" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div>
                <label htmlFor="member-name">Name <span>(optional)</span></label>
                <input id="member-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} />
              </div>
            </div>
            <label htmlFor="member-role">Role</label>
            <select id="member-role" value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
              {(Object.keys(ROLE_LABELS) as StaffRole[]).map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}: {ROLE_HELP[value]}</option>)}
            </select>
            <button type="submit" className="staff-button staff-button--primary">Add member</button>
          </fieldset>
          <p className="staff-hint">They sign in with their DAU Google account, no password to share, and add their own name and pen name the first time.</p>
        </form>
      )}

      <p className="post-editor__messages" role="status" aria-live="polite">
        {notice && <span className="staff-notice">{notice}</span>}
        {error && <span className="staff-error">{error}</span>}
      </p>

      <section className="staff-group" aria-labelledby="team-list">
        <h2 id="team-list">Team <span>{members.filter((member) => member.active).length} active</span></h2>
        <ul className="staff-list staff-list--members">
          {members.map((member) => (
            <li key={member.email} className={member.active ? undefined : "is-paused"}>
              <div>
                <strong>{label(member)}{member.email === me ? " (you)" : ""}</strong>
                <span>
                  {member.name ? member.email : ""}
                  {member.pen_name ? `${member.name ? " · " : ""}writes as ${member.pen_name}` : ""}
                  {!member.profile_completed_at ? `${member.name || member.pen_name ? " · " : ""}name not set up yet` : ""}
                  {member.active ? "" : " · access paused"}
                </span>
              </div>
              {isConvenor ? (
                <div className="members-manager__controls">
                  <label className="visually-hidden" htmlFor={`role-${member.email}`}>Role for {label(member)}</label>
                  <select
                    id={`role-${member.email}`}
                    value={member.role}
                    disabled={busy}
                    onChange={(event) => run(
                      () => supabase().update({ role: event.target.value }, { count: "exact" }).eq("email", member.email),
                      `${label(member)} is now ${ROLE_LABELS[event.target.value as StaffRole].toLowerCase()}.`,
                    )}
                  >
                    {(Object.keys(ROLE_LABELS) as StaffRole[]).map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}</option>)}
                  </select>
                  <button
                    type="button"
                    className="staff-link-button"
                    disabled={busy}
                    onClick={() => run(
                      () => supabase().update({ active: !member.active }, { count: "exact" }).eq("email", member.email),
                      member.active ? `${label(member)}'s access is paused.` : `${label(member)} can sign in again.`,
                    )}
                  >
                    {member.active ? "Pause access" : "Restore access"}
                  </button>
                  {confirming === member.email ? (
                    <span className="post-editor__confirm">
                      Remove {label(member)}?
                      <button type="button" className="staff-button staff-button--danger" disabled={busy}
                        onClick={async () => { if (await run(() => supabase().delete({ count: "exact" }).eq("email", member.email), `${label(member)} was removed from the team.`)) setConfirming(null); }}>
                        Yes, remove
                      </button>
                      <button type="button" className="staff-button" onClick={() => setConfirming(null)}>Keep</button>
                    </span>
                  ) : (
                    <button type="button" className="staff-link-button" onClick={() => setConfirming(member.email)}>Remove</button>
                  )}
                </div>
              ) : (
                <span className={`staff-role staff-role--${member.role}`}>{ROLE_LABELS[member.role]}</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
