import { defaultLocale, type Locale } from "@/config/i18n.config"
import { deepMerge } from "@/utils/deep-merge"

type MessageTree = { [key: string]: string | MessageTree }

// Discovered at build time: adding a page = adding its JSON. Each file is its own chunk, so
// only the active locale (plus the default, as the fallback layer) is downloaded.
const files = import.meta.glob<{ default: MessageTree }>("@/locales/*/*.json")

// "/src/locales/es/favourites.json" → "favourites"
const fileKey = (path: string) => path.split("/").pop()?.replace(/\.json$/, "") ?? ""

const loadLocale = async (locale: Locale): Promise<MessageTree> => {
  const own = Object.entries(files).filter(([path]) => path.includes(`/locales/${locale}/`))
  const loaded = await Promise.all(
    own.map(async ([path, load]) => [fileKey(path), (await load()).default] as const),
  )
  const { common = {}, ...pages } = Object.fromEntries(loaded)
  return { ...common, ...pages }
}

export const loadMessages = async (locale: Locale): Promise<MessageTree> =>
  locale === defaultLocale
    ? loadLocale(locale)
    : deepMerge(await loadLocale(defaultLocale), await loadLocale(locale))
