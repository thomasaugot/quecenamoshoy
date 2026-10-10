import { useTranslations } from "use-intl"

// First focusable element in the DOM — before the navbar, before everything.
export const SkipLink = ({ targetId }: { targetId: string }) => {
  const t = useTranslations("a11y")
  return (
    <a
      href={`#${targetId}`}
      className="keyboard-focus-ring text-button sr-only z-loader rounded-lg bg-surface px-4 py-3 shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
    >
      {t("skipToContent")}
    </a>
  )
}
