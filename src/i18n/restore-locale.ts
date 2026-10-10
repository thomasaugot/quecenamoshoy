import { preferredStartPath } from "@/i18n/preferred-locale"

// Runs on import, BEFORE the router module is evaluated (main.tsx imports this first): the
// router reads the URL when it is created. Rewriting the URL here, before any route exists,
// is safe — the ban on replaceState is about switching language AFTER messages are loaded.
const target = preferredStartPath(window.location.pathname)
if (target) window.history.replaceState(null, "", `${target}${window.location.search}${window.location.hash}`)
