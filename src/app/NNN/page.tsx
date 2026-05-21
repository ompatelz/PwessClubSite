import { supabase } from "@/lib/supabase";
type Edition={
  id: number;
  Month: number;
  Year: number;
  Pdf_url: string;
  };
export default async function NNNPage() {
 const { data, error } = await supabase
    .from("NNN")
    .select("*")
    .order("id", { ascending: true });

  console.log(data);

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-5xl font-bold mb-8">News and Nonsense</h1>
      <p className="text-zinc-400 mb-10">
      Browse current and previous editions of the college newspaper - NNN
      </p>
      <div className="grid gap-6">
        {data?.map((edition : Edition) => (
          <a
            key={edition.id}
            href={`/NNN/${edition.id}`}
            target="_blank"
            className="rounded-2xl border border-zinc-800 p-6 hover:border-zinc-600 transition"
          >
            <h2 className="text-2xl font-semibold">
            {edition.Month} <span className="text-zinc-500">{edition.Year}</span>
            </h2>

  
          </a>
        ))}
      </div>
    </main>
  );
}