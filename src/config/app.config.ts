const required = (name: string, value: string | undefined): string => {
  if (!value) throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`)
  return value
}

export const appConfig = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  supabaseUrl: required("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL),
  supabaseKey: required("VITE_SUPABASE_PUBLISHABLE_KEY", import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY),
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || null,
  timeZone: "Europe/Madrid",
} as const
