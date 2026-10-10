import { gsap } from "@/lib/gsap"

const q = (root: HTMLElement, name: string) => root.querySelector<HTMLElement>(`[data-anim="${name}"]`)

// Brand mark rises in, bar starts its fill. The bar only ever moves left → right, with
// power2.out — an inOut ease reads as the bar reversing (build-page-loader skill).
export const initLoader = (root: HTMLElement): (() => void) => {
  const ctx = gsap.context(() => {
    const mark = q(root, "loader-mark")
    const line = q(root, "loader-line")
    if (line) gsap.set(line, { scaleX: 0 })
    if (mark) gsap.fromTo(mark, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" })
  }, root)
  return () => ctx.revert()
}

export const tickProgress = (root: HTMLElement, targetScale: number, duration: number): void => {
  const line = q(root, "loader-line")
  if (line) gsap.to(line, { scaleX: targetScale, duration, ease: "power2.out" })
}

export const exitLoader = (root: HTMLElement, reduced: boolean, onComplete: () => void): void => {
  const line = q(root, "loader-line")
  const mark = q(root, "loader-mark")
  if (line) gsap.killTweensOf(line)
  if (reduced) {
    gsap.to(root, { autoAlpha: 0, duration: 0.2, onComplete })
    return
  }
  gsap.timeline({ onComplete })
    .to(line, { scaleX: 1, duration: 0.35, ease: "power2.out" })
    .to(mark, { autoAlpha: 0, y: -8, duration: 0.3, ease: "power2.in" })
    .to(root, { clipPath: "inset(0 0 100% 0)", duration: 0.55, ease: "power3.inOut" }, "<0.1")
}
