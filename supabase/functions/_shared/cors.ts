// The app's own origins only, never "*" (11-SECURITY). ALLOWED_ORIGINS is a comma-separated
// Supabase secret, e.g. "http://localhost:5173,https://quecenamoshoy.helloimtom.dev".
// Read per request: with it missing, the preflight still answers (with no allowed origin).
const allowedOrigins = () => (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o) => o.trim()).filter(Boolean)

export const corsHeaders = (req: Request): Record<string, string> => {
  const allowed = allowedOrigins()
  const origin = req.headers.get("origin") ?? ""
  return {
    "Access-Control-Allow-Origin": allowed.includes(origin) ? origin : allowed[0] ?? "",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  }
}

export const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders(req), "Content-Type": "application/json" } })

export const preflight = (req: Request) => new Response("ok", { headers: corsHeaders(req) })
