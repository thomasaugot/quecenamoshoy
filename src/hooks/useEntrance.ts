import { useEffect, type RefObject } from "react"
import { useLocation } from "react-router"
import { useLoaderGone } from "@/hooks/useAppReady"
import { useMotionPreference } from "@/hooks/useMotionPreference"

type EntranceFn = (root: HTMLElement, reducedByUser: boolean) => () => void

// First-paint entrances: gated on loaderGone (never under the loader) AND keyed on pathname
// (loaderGone is one-shot — without pathname it would play once per session). 05-ANIMATIONS.
// waitForLoader: false for things that live INSIDE the loader (the logo): they must play now.
export const useEntrance = (
  rootRef: RefObject<HTMLElement | null>,
  init: EntranceFn,
  { waitForLoader = true }: { waitForLoader?: boolean } = {},
) => {
  const loaderGone = useLoaderGone()
  const { pathname } = useLocation()
  const { preference } = useMotionPreference()

  useEffect(() => {
    const root = rootRef.current
    if ((waitForLoader && !loaderGone) || !root) return
    return init(root, preference === "reduced")
  }, [loaderGone, waitForLoader, pathname, preference, rootRef, init])
}
