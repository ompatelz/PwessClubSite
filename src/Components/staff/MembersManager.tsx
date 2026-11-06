"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { ROLE_LABELS, type StaffRole } from "@/lib/staff-roles";

type Member = { email: string; name: string; role: StaffRole; active: boolean; added_by: string | null; created_at: string };

const ROLE_HELP: Record<StaffRole, string> = {
  convenor: "Manages the team; can do everything an editor can.",
  editor: "Publishes and edits any post; adds and removes editions.",
  writer: "Writes posts and submits them for review.",
};

function friendly(error: { code?: string; message?: string }) {
  if (error.code === "23505") return "That address is already on the team.";
  if (error.code === "23514" && /convenor/i.test(error.message ?? "")) return "The Press Club needs at least one active convenor. Make someone else convenor first.";
  if (error.code === "23514") return "Use a @dau.ac.in address and a name of at least 2 characters.";
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
    const address = email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@dau\.ac\.in$/.test(address)) return setError("Use the member's @dau.ac.in address.");
    if (name.trim().length < 2) return setError("Add the member's name.");
    const ok = await run(
      () => getBrowserSupabase().from("staff_members").insert({ email: address, name: name.trim(), role }),
      `${name.trim()} can now sign in with ${address}.`,
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
                <label htmlFor="member-email">DAU email</label>
                <input id="member-email" type="email" placeholder="name@dau.ac.in" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div>
                <label htmlFor="member-name">Name</label>
                <input id="member-name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
              </div>
            </div>
            <label htmlFor="member-role">Role</label>
            <select id="member-role" value={role} onChange={(event) => setRole(event.target.value as StaffRole)}>
              {(Object.keys(ROLE_LABELS) as StaffRole[]).map((value) => <option key={value} value={value}>{ROLE_LABELS[value]}: {ROLE_HELP[value]}</option>)}
            </select>
            <button type="submit" className="staff-button staff-button--primary">Add member</button>
          </fieldset>
          <p className="staff-hint">They sign in with their DAU Google account. No password to share.</p>
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
                <strong>{member.name}{member.email === me ? " (you)" : ""}</strong>
                <span>{member.email}{member.active ? "" : " · access paused"}</span>
              </div>
              {isConvenor ? (
                <div className="members-manager__controls">
                  <label className="visually-hidden" htmlFor={`role-${member.email}`}>Role for {member.name}</label>
                  <select
                    id={`role-${member.email}`}
                    value={member.role}
                    disabled={busy}
                    onChange={(event) => run(
                      () => supabase().update({ role: event.target.value }, { count: "exact" }).eq("email", member.email),
                      `${member.name} is now ${ROLE_LABELS[event.target.value as StaffRole].toLowerCase()}.`,
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
                      member.active ? `${member.name}'s access is paused.` : `${member.name} can sign in again.`,
                    )}
                  >
                    {member.active ? "Pause access" : "Restore access"}
                  </button>
                  {confirming === member.email ? (
                    <span className="post-editor__confirm">
                      Remove {member.name}?
                      <button type="button" className="staff-button staff-button--danger" disabled={busy}
                        onClick={async () => { if (await run(() => supabase().delete({ count: "exact" }).eq("email", member.email), `${member.name} was removed from the team.`)) setConfirming(null); }}>
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
