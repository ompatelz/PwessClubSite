import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import TeaReviewerLogin from "@/Components/TeaReviewerLogin";
import TeaReviewDesk from "@/Components/TeaReviewDesk";
import { reviewerConfigured, reviewerCookie, validReviewerSession } from "@/lib/tea-auth";
import { getTeaDb, teaEnabled, type TeaPost } from "@/lib/tea";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Press Club review desk",
  robots: { index: false, follow: false },
};

export default async function ReviewPage() {
  if (!teaEnabled()) notFound();
  const db = getTeaDb();
  const configured = reviewerConfigured();
  const token = (await cookies()).get(reviewerCookie)?.value;
  const signedIn = configured && validReviewerSession(token);
  const result = signedIn && db ? await db.from("tea_posts")
    .select("id,submitted_title,submitted_body,edited_title,edited_body,status,created_at,updated_at,published_at")
    .order("created_at", { ascending: false }).limit(100) : null;
  const posts = (result?.data ?? []) as TeaPost[];

  return (
    <main id="main-content" className="site-main tea-page tea-page--review">
      <header className="tea-header">
        <h1>Review desk.</h1>
        <p>Read the original, prepare the public version, and decide when it goes on the page.</p>
      </header>
      {!configured ? <p className="tea-feed__empty">The review desk is being prepared.</p>
        : !signedIn ? <TeaReviewerLogin />
          : !db ? <p className="tea-feed__empty">Signed in. The review queue will open when storage is connected.</p>
          : result?.error ? <p className="tea-feed__empty">Posts could not be loaded. Please refresh the page.</p>
            : <TeaReviewDesk posts={posts} />}
    </main>
  );
}
