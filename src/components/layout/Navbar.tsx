import { useLocale, useTranslations } from "use-intl"
import { Button } from "@/components/ui/Button"
import { Cloche } from "@/components/ui/Cloche"
import { IconSignOut } from "@/components/ui/Icons"
import { NavIcon } from "@/components/ui/NavIcon"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { NAV_ITEMS } from "@/constants/nav"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentRouteKey } from "@/hooks/useLocaleData"
import { useSignOut } from "@/hooks/useSignOut"
import { localizedPath } from "@/i18n/paths"

// PLACEHOLDER layout until the design pass: fixed top bar, inline links from md up
// (BottomTabs carries them on phones). Hide-on-scroll waits for the design (MEMORY.md).
export const Navbar = () => {
  const t = useTranslations()
  const locale = useLocale()
  const current = useCurrentRouteKey()
  const { session } = useAuth()
  const signOut = useSignOut()
  if (!session) return null

  return (
    <header className="z-nav fixed inset-x-0 top-0 h-navbar border-b border-border bg-surface">
      <div className="mx-auto flex h-full max-w-5xl items-center justify-between gap-4 px-4">
        <TransitionLink href={localizedPath("home", locale)} className="keyboard-focus-ring text-subheading flex items-center gap-2 rounded-md">
          <Cloche className="h-10" />
          {t("app.name")}
        </TransitionLink>
        <nav aria-label={t("a11y.mainNav")} className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.routeKey}>
                  <TransitionLink
                    href={localizedPath(item.routeKey, locale)}
                    aria-current={current === item.routeKey ? "page" : undefined}
                    className="keyboard-focus-ring text-button flex items-center gap-2 rounded-lg px-3 py-2 text-text-muted aria-[current=page]:bg-surface-2 aria-[current=page]:text-text"
                  >
                    <NavIcon name={item.icon} className="h-4 w-4" />
                    {t(`nav.${item.labelKey}`)}
                  </TransitionLink>
                </li>
              ))}
            </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void signOut()}
            aria-label={t("nav.signOut")}
            icon={<IconSignOut className="h-5 w-5 shrink-0" />}
            className="text-text-muted"
          />
        </div>
      </div>
    </header>
  )
}
