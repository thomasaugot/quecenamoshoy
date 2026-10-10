import { gsap } from "@/lib/gsap"

const q = (root: HTMLElement, name: string) => root.querySelector<HTMLElement>(`[data-anim="${name}"]`)

// The logo and its caption rise in; the bar starts at 0 — set on GSAP too, or it reads the
// starting value as scaleX(1) and fills backwards (build-page-loader skill).
export const initLoader = (root: HTMLElement, reducedByUser: boolean): (() => void) => {
  const ctx = gsap.context(() => {
    const content = q(root, "loader-content")
    const line = q(root, "loader-line")
    if (line) gsap.set(line, { scaleX: 0 })
    if (!content) return
    if (reducedByUser || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(content, { autoAlpha: 1 })
      return
    }
    gsap.fromTo(content, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" })
  }, root)
  return () => ctx.revert()
}

// Left → right only, power2.out only: an inOut ease reads as the bar going backwards.
export const tickProgress = (root: HTMLElement, targetScale: number, duration: number): void => {
  const line = q(root, "loader-line")
  if (line) gsap.to(line, { scaleX: targetScale, duration, ease: "power2.out" })
}

// The bar completes, the logo and caption rise away, then the ground fades: the app is there.
export const exitLoader = (root: HTMLElement, reduced: boolean, onComplete: () => void): void => {
  const line = q(root, "loader-line")
  const content = q(root, "loader-content")
  if (line) gsap.killTweensOf(line)
  if (reduced) {
    gsap.to(root, { autoAlpha: 0, duration: 0.25, onComplete })
    return
  }
  gsap.timeline({ onComplete })
    .to(line ?? [], { scaleX: 1, duration: 0.35, ease: "power2.out" })
    .to(content ?? [], { y: -24, autoAlpha: 0, duration: 0.45, ease: "power2.in" }, "+=0.1")
    .to(root, { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, "-=0.15")
}
