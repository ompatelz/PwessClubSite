import { getTeaDb } from "@/lib/tea";
import { consumeRateLimit, readJsonBody } from "@/lib/request-security";
import { summarizeCspReport } from "@/lib/csp-report";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const parsed = await readJsonBody(request, 8192, ["application/csp-report", "application/reports+json", "application/json"]);
  if (!parsed.ok) return new Response(null, { status: parsed.reason === "too_large" ? 413 : 400 });
  const db = getTeaDb();
  if (!db) return new Response(null, { status: 503 });
  const rate = await consumeRateLimit(db, request, "csp-report", 20, 3600);
  if (rate !== "allowed") return new Response(null, { status: rate === "limited" ? 429 : 503 });
  for (const report of summarizeCspReport(parsed.value)) console.warn("CSP violation", report);
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
