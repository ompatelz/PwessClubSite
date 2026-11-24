import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeaReviewDesk from "@/Components/TeaReviewDesk";
import TeaDiscussionReview from "@/Components/TeaDiscussionReview";
import "@/app/tea-discussion.css";
import StaffShell from "@/Components/staff/StaffShell";
import { canPublish, getStaffSession } from "@/lib/staff";
import { getTeaDb, teaEnabled, type TeaPost } from "@/lib/tea";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus Tea � Staff desk",
  robots: { index: false, follow: false },
};

// Campus Tea moderation lives on the staff desk: staff sign in with their DAU
// Google account, and editors and the convenor review the anonymous posts.
export default async function StaffTeaPage() {
  if (!teaEnabled()) notFound();
  const session = await getStaffSession();
  if (session.state !== "staff") return <StaffShell session={session} section="tea">{null}</StaffShell>;

  const allowed = canPublish(session.role);
  // tea_posts is closed to signed-in users at the database; only the server's
  // service connection reads it, and only after the role check above.
  const db = allowed ? getTeaDb() : null;
  const result = db ? await db.from("tea_posts")
    .select("id,submitted_title,submitted_body,edited_title,edited_body,status,created_at,updated_at,published_at")
    .order("created_at", { ascending: false }).limit(100) : null;
  const posts = (result?.data ?? []) as TeaPost[];

  return (
    <StaffShell session={session} section="tea">
      <section className="staff-section" aria-labelledby="tea-title">
        <h1 id="tea-title">Campus Tea</h1>
        <p className="staff-hint">Read the original, prepare the public version, and decide when it goes on the page.</p>
        {!allowed ? <p className="tea-feed__empty">Only editors and the convenor review Campus Tea posts.</p>
          : !db ? <p className="tea-feed__empty">The review queue will open when storage is connected.</p>
            : result?.error ? <p className="tea-feed__empty">Posts could not be loaded. Please refresh the page.</p>
              : <TeaReviewDesk posts={posts} />}
        {allowed && db && <TeaDiscussionReview />}
      </section>
    </StaffShell>
  );
}
