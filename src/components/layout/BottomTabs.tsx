import { useLocale, useTranslations } from "use-intl"
import { NavIcon } from "@/components/ui/NavIcon"
import { TransitionLink } from "@/components/ui/TransitionLink"
import { NAV_ITEMS } from "@/constants/nav"
import { useAuth } from "@/hooks/useAuth"
import { useCurrentRouteKey } from "@/hooks/useLocaleData"
import { localizedPath } from "@/i18n/paths"

// Thumb-reach navigation on phones (brief §3.2). Hidden from md up, where Navbar carries it.
export const BottomTabs = () => {
  const t = useTranslations()
  const locale = useLocale()
  const current = useCurrentRouteKey()
  const { session } = useAuth()
  if (!session) return null

  return (
    <nav aria-label={t("a11y.mainNav")} className="z-nav fixed inset-x-0 bottom-0 h-bottom-nav border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid h-full grid-cols-5">
        {NAV_ITEMS.map((item) => (
          <li key={item.routeKey} className="flex">
            <TransitionLink
              href={localizedPath(item.routeKey, locale)}
              aria-current={current === item.routeKey ? "page" : undefined}
              className="keyboard-focus-ring text-body-sm flex grow flex-col items-center justify-center gap-1 aria-[current=page]:text-primary"
            >
              <NavIcon name={item.icon} className="h-6 w-6" />
              {t(`nav.${item.labelKey}`)}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
