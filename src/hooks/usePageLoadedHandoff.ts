import { useLayoutEffect } from "react"
import { PAGE_LOADED_EVENT } from "@/constants/events"

// For a page's loading state (PageLoading, skeletons): its cleanup runs in the commit that swaps
// in the real page, so PageShell hides <main> and replays the entrance before paint
// (14-PERFORMANCE → Page loading state).
export const usePageLoadedHandoff = () => {
  useLayoutEffect(() => () => { window.dispatchEvent(new Event(PAGE_LOADED_EVENT)) }, [])
}
