import Link from "next/link";
import PDFWrapper from "@/Components/PDF_wrapper";
import ArchiveState from "@/Components/ArchiveState";
import { getSupabaseClient } from "@/lib/supabase";

export default async function EntelechyEditionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    return (
      <main id="main-content" className="site-main reader-page">
        <ArchiveState
          title="This edition is unavailable."
          message="The Entelechy archive is not connected in this environment."
        />
      </main>
    );
  }

  const { data, error } = await supabase
    .from("Entelechy")
    .select("id,edition,pdf_url")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main id="main-content" className="site-main reader-page">
        <ArchiveState
          title="Edition not found."
          message="This Entelechy edition may have moved or is not available yet."
        />
      </main>
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("Entelechy")
    .getPublicUrl(data.pdf_url);
  const documentUrl = String(data.pdf_url).startsWith("http")
    ? data.pdf_url
    : publicUrlData.publicUrl;

  return (
    <main id="main-content" className="site-main reader-page">
      <header className="reader-header">
        <Link className="type-link" href="/Entelechy">
          <span aria-hidden="true">←</span> Entelechy archive
        </Link>
        <h1>Edition {data.edition}</h1>
        <p>Entelechy · digital reading copy</p>
      </header>
      <PDFWrapper url={documentUrl} />
    </main>
  );
}
