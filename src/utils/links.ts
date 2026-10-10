import { routeKeyFromPath } from "@/i18n/paths"

export const isExternalHref = (href: string) => /^(https?:|mailto:|tel:|\/\/)/.test(href)

const clean = (path: string) => (path.split(/[?#]/)[0] ?? "").replace(/\/+$/, "") || "/"

// Same page = same URL once query/hash and trailing slash are ignored. Both sides carry
// their locale prefix here (links are built with localizedPath), so they compare directly.
export const isSamePage = (pathname: string, href: string) =>
  clean(pathname) === clean(href) && routeKeyFromPath(href) !== null
