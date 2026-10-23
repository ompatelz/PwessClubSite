import type { Metadata } from "next";
import { notFound } from "next/navigation";
import TeaSubmissionForm from "@/Components/TeaSubmissionForm";
import { teaEnabled, type TeaPost } from "@/lib/tea";
import { getSupabaseClient } from "@/lib/supabase";
import { partitionPostsByAge } from "@/lib/stories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campus Tea",
  description: "Anonymous campus posts, reviewed by the Press Club before publication.",
};

export default async function TeaPage() {
  if (!teaEnabled()) notFound();
  const db = getSupabaseClient();
  const now = new Date();
  const result = db ? await db.from("tea_posts")
    .select("id,edited_title,edited_body,published_at")
    .lte("published_at", now.toISOString())
    .order("published_at", { ascending: false })
    .limit(50) : null;
  const posts = (result?.data ?? []) as Pick<TeaPost, "id" | "edited_title" | "edited_body" | "published_at">[];
  const { newest, older } = partitionPostsByAge(posts, now);
  const ready = Boolean(db && !result?.error);

  const renderPosts = (items: typeof posts) => items.map((post) => (
    <article className="tea-post" key={post.id}>
      <div className="tea-post__meta">
        <span>Anonymous</span>
        {post.published_at && <time dateTime={post.published_at}>
          {new Date(post.published_at).toLocaleDateString("en-IN", { dateStyle: "medium", timeZone: "UTC" })}
        </time>}
      </div>
      <h3>{post.edited_title}</h3>
      <p>{post.edited_body}</p>
    </article>
  ));

  return (
    <main id="main-content" className="site-main tea-page">
      <header className="tea-header">
        <h1>Campus tea.</h1>
        <p>Anonymous posts from around DAU. Every submission reaches the Press Club review desk before it can appear here.</p>
        <a className="tea-header__login" href="#submit-tea">Submit Tea <span aria-hidden="true">↓</span></a>
      </header>

      <div className="tea-page__columns">
        <section className="tea-feed" aria-label="Published posts">
          {!ready ? <p className="tea-feed__empty">The review desk is being prepared. Check back soon.</p>
            : posts.length === 0 ? <p className="tea-feed__empty">No posts have been published yet.</p>
              : <>
                <section className="post-age-group" aria-labelledby="newest-tea-title">
                  <h2 id="newest-tea-title">Newest</h2>
                  {newest.length > 0
                    ? renderPosts(newest)
                    : <p className="post-age-group__empty">No posts were published in the past week.</p>}
                </section>
                {older.length > 0 && (
                  <section className="post-age-group" aria-labelledby="older-tea-title">
                    <h2 id="older-tea-title">Older posts</h2>
                    {renderPosts(older)}
                  </section>
                )}
              </>}
        </section>
        <TeaSubmissionForm available={ready} />
      </div>
    </main>
  );
}
