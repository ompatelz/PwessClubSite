import type { Metadata } from "next";
import Link from "next/link";
import StaffShell from "@/Components/staff/StaffShell";
import { getStaffSession } from "@/lib/staff";
import { formatStoryDate } from "@/lib/stories";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staff desk",
  robots: { index: false, follow: false },
};

type PostRow = {
  id: number;
  slug: string;
  title: string;
  author: string;
  status: "draft" | "review" | "published" | "archived";
  published_at: string | null;
  updated_at: string;
  created_by: string | null;
};

const GROUPS = [
  { id: "review", title: "Waiting for review", empty: "Nothing is waiting for an editor." },
  { id: "draft", title: "Drafts", empty: "No drafts." },
  { id: "scheduled", title: "Scheduled", empty: "Nothing is scheduled." },
  { id: "published", title: "Published", empty: "Nothing published yet." },
  { id: "archived", title: "Archived", empty: "Nothing archived." },
] as const;

function groupOf(post: PostRow, now: number) {
  if (post.status === "published" && post.published_at && new Date(post.published_at).getTime() > now) return "scheduled";
  return post.status;
}

export default async function StaffPostsPage({ searchParams }: { searchParams: Promise<{ signin?: string }> }) {
  const session = await getStaffSession();
  const { signin } = await searchParams;

  if (session.state !== "staff") {
    return <StaffShell session={session} section="posts" signInFailed={signin === "failed"}>{null}</StaffShell>;
  }

  const { data, error } = await session.supabase
    .from("blog_posts")
    .select("id,slug,title,author,status,published_at,updated_at,created_by")
    .order("updated_at", { ascending: false })
    .limit(200);
  const posts = (data ?? []) as PostRow[];
  const now = new Date().getTime();

  return (
    <StaffShell session={session} section="posts">
      <section className="staff-section" aria-labelledby="posts-title">
        <div className="staff-section__head">
          <h1 id="posts-title">Blog posts</h1>
          <Link className="front-button front-button--entelechy" href="/press-club/posts/new">Write a new post</Link>
        </div>
        {session.role === "writer" && (
          <p className="staff-hint">As a writer you can save drafts and submit them for review. An editor publishes them.</p>
        )}
        {error && <p className="staff-error" role="alert">Posts could not be loaded. Refresh the page to try again.</p>}

        {GROUPS.map((group) => {
          const items = posts.filter((post) => groupOf(post, now) === group.id);
          if (group.id === "archived" && items.length === 0) return null;
          return (
            <section key={group.id} className="staff-group" aria-labelledby={`group-${group.id}`}>
              <h2 id={`group-${group.id}`}>{group.title} <span>{items.length}</span></h2>
              {items.length === 0 ? (
                <p className="staff-empty">{group.empty}</p>
              ) : (
                <ul className="staff-list">
                  {items.map((post) => (
                    <li key={post.id}>
                      <Link href={`/press-club/posts/${post.id}`}>
                        <strong>{post.title}</strong>
                        <span>
                          {post.author}
                          {post.published_at && (group.id === "published" || group.id === "scheduled")
                            ? ` · ${group.id === "scheduled" ? "goes live" : "published"} ${formatStoryDate(post.published_at)}`
                            : ` · edited ${formatStoryDate(post.updated_at)}`}
                        </span>
                      </Link>
                      {group.id === "published" && (
                        <a className="staff-list__view" href={`/Blog/${post.slug}`} target="_blank" rel="noreferrer">View</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </section>
    </StaffShell>
  );
}
