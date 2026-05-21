import { supabase } from "@/lib/supabase";
import PDFviewer from "@/Components/PDFviewer";
import PDFWrapper from "@/Components/PDF_wrapper";

export default async function PDF_viewer(
{
  params,
}: {
  params: Promise<{ id: string }>;
}) {

  const { id } = await params;

  const { data } = await supabase
    .from("NNN")
    .select("*")
    .eq("id", id)
    .single();

  if (!data) {
    return <div>Edition not found</div>;
  }

  const { data: publicUrlData } = supabase.storage
    .from("NNN")
    .getPublicUrl(data.Pdf_url);

  return (
    <main className="min-h-screen bg-black text-white p-10">

      <h1 className="text-5xl font-bold mb-8">
        {data.Month} {data.Year}
      </h1>

      <div className="text-zinc-400 mb-10">

      <PDFWrapper url={data.Pdf_url} />
      </div>

    </main>
  );
}