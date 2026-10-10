import type { ReactNode } from "react"
import { useTranslations } from "use-intl"
import { usePageLoadedHandoff } from "@/hooks/usePageLoadedHandoff"

// The frame every page skeleton sits in: same width and padding as the pages, busy for
// assistive tech, and the hand-off to PageShell's entrance when the real page arrives.
export const PageSkeleton = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const t = useTranslations("a11y")
  usePageLoadedHandoff()
  return (
    <div aria-busy="true" aria-label={t("loading")} role="status"
      className={`mx-auto min-h-svh w-full max-w-md px-6 pt-6 pb-10 md:max-w-3xl lg:max-w-310 lg:px-8 lg:pt-11 lg:pb-16 ${className}`}>
      {children}
    </div>
  )
}
