export async function GET() {
  return new Response("Contact: mailto:pressclub@dau.ac.in\nExpires: 2027-11-01T00:00:00Z\nPreferred-Languages: en\n", {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
}
