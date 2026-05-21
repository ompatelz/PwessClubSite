import { supabase } from "@/lib/supabase";
type Edition={
  id: number;
  edition: number;
  pdf_url: string;}

export default async function EntelechyPage() {
   const { data, error } = await supabase
    .from("Entelechy")
    .select("*")
    .order("id", { ascending: true });

  console.log(data);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-8">
        Entelechy
      </h1>

      <p className="text-zinc-400 mb-10">
        Browse current and previous editions of the college Magazine - Entelechy
      </p>
      <div className="grid gap-6">
        {data?.map((edition : Edition) => (
          <a
            key={edition.id}
            href={`/Entelechy/${edition.id}`}
            target="_blank"
            className="rounded-2xl border border-zinc-800 p-6 hover:border-zinc-600 transition"
          >
            <h2 className="text-2xl font-semibold">
            Edition {edition.edition}
            </h2>

  
          </a>
        ))}
      </div>
    </main>
  );
}