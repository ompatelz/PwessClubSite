import type { Metadata } from "next";
import Link from "next/link";
import PostEditor from "@/Components/staff/PostEditor";
import StaffShell from "@/Components/staff/StaffShell";
import { getStaffSession } from "@/lib/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New post · Staff desk",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const session = await getStaffSession();
  if (session.state !== "staff") return <StaffShell session={session} section="posts">{null}</StaffShell>;

  return (
    <StaffShell session={session} section="posts">
      <section className="staff-section" aria-labelledby="new-post-title">
        <Link className="type-link" href="/press-club"><span aria-hidden="true">←</span> All posts</Link>
        <h1 id="new-post-title">New post</h1>
        <PostEditor post={null} role={session.role} memberName={session.name} memberEmail={session.email} />
      </section>
    </StaffShell>
  );
}
