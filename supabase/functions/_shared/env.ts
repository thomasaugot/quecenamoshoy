// Required configuration, checked per request rather than at import: a missing variable must
// still fail CLOSED (500, nothing runs), but a crash at import also kills the CORS preflight,
// and the browser then only reports a meaningless "CORS error".
const REQUIRED = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "GEMINI_API_KEY", "ALLOWED_ORIGINS"] as const
type EnvName = (typeof REQUIRED)[number]

export const missingEnv = (): EnvName[] => REQUIRED.filter((name) => !Deno.env.get(name))

export const env = (name: EnvName): string => {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not set`)
  return value
}
