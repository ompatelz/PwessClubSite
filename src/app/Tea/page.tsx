import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TeaSubmissionForm from "@/Components/TeaSubmissionForm";
import { getTeaDb, teaEnabled, type TeaPost } from "@/lib/tea";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus Tea",
  description: "Anonymous campus posts, reviewed by the Press Club before publication.",
};

export default async function TeaPage() {
  if (!teaEnabled()) notFound();
  const db = getTeaDb();
  const result = db ? await db.from("tea_posts")
    .select("id,edited_title,edited_body,published_at")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50) : null;
  const posts = (result?.data ?? []) as Pick<TeaPost, "id" | "edited_title" | "edited_body" | "published_at">[];
  const ready = Boolean(db && !result?.error);

  return (
    <main id="main-content" className="site-main tea-page">
      <header className="tea-header">
        <h1>Campus tea.</h1>
        <p>Anonymous posts from around DAU. Every submission reaches the Press Club review desk before it can appear here.</p>
        <Link className="tea-header__login" href="/press-club">Press Club login <span aria-hidden="true">↗</span></Link>
      </header>

      <div className="tea-page__columns">
        <section className="tea-feed" aria-label="Published posts">
          <h2>On the page</h2>
          {!ready ? <p className="tea-feed__empty">The review desk is being prepared. Check back soon.</p>
            : posts.length === 0 ? <p className="tea-feed__empty">No posts have been published yet.</p>
              : posts.map((post) => <article className="tea-post" key={post.id}>
                <div className="tea-post__meta">
                  <span>Anonymous</span>
                  {post.published_at && <time dateTime={post.published_at}>
                    {new Date(post.published_at).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" })}
                  </time>}
                </div>
                <h3>{post.edited_title}</h3>
                <p>{post.edited_body}</p>
              </article>)}
        </section>
        <TeaSubmissionForm available={ready} />
      </div>
    </main>
  );
}
