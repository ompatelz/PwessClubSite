import type { Metadata } from "next";
import Link from "next/link";
import PostEditor, { type EditablePost } from "@/Components/staff/PostEditor";
import StaffShell from "@/Components/staff/StaffShell";
import { getStaffSession } from "@/lib/staff";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit post · Staff desk",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getStaffSession();
  if (session.state !== "staff") return <StaffShell session={session} section="posts">{null}</StaffShell>;

  const { id } = await params;
  const { data } = await session.supabase
    .from("blog_posts")
    .select("id,slug,title,excerpt,body,author,status,published_at,created_by")
    .eq("id", Number(id))
    .maybeSingle();

  return (
    <StaffShell session={session} section="posts">
      <section className="staff-section" aria-labelledby="edit-post-title">
        <Link className="type-link" href="/press-club"><span aria-hidden="true">←</span> All posts</Link>
        {data ? (
          <>
            <h1 id="edit-post-title">Edit post</h1>
            <PostEditor post={data as EditablePost} role={session.role} memberName={session.name} memberEmail={session.email} />
          </>
        ) : (
          <>
            <h1 id="edit-post-title">Post not found</h1>
            <p className="staff-empty">It may have been deleted.</p>
          </>
        )}
      </section>
    </StaffShell>
  );
}
