import Link from "next/link";
import PDFWrapper from "@/Components/PDF_wrapper";
import ArchiveState from "@/Components/ArchiveState";
import { getSupabaseClient } from "@/lib/supabase";

export default async function NNNEditionPage({
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
          message="The NNN archive is not connected in this environment."
        />
      </main>
    );
  }

  const { data, error } = await supabase
    .from("NNN")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return (
      <main id="main-content" className="site-main reader-page">
        <ArchiveState
          title="Edition not found."
          message="This NNN edition may have moved or is not available yet."
        />
      </main>
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("NNN")
    .getPublicUrl(data.Pdf_url);
  const documentUrl = String(data.Pdf_url).startsWith("http")
    ? data.Pdf_url
    : publicUrlData.publicUrl;

  return (
    <main id="main-content" className="site-main reader-page">
      <header className="reader-header">
        <Link className="type-link" href="/NNN">
          <span aria-hidden="true">←</span> NNN archive
        </Link>
        <h1>
          {data.Month} {data.Year}
        </h1>
        <p>News and Nonsense · digital reading copy</p>
      </header>
      <PDFWrapper url={documentUrl} />
    </main>
  );
}
