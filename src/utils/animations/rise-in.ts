import { gsap } from "@/lib/gsap"

// A block that appears after the page entrance (the next question, the results): it ships
// `invisible` and rises in. Reduced motion: it simply appears.
//   [data-anim="step"]  the block
export const initRiseIn = (root: HTMLElement, reducedByUser: boolean): (() => void) => {
  const mm = gsap.matchMedia(root)
  mm.add({ motionOk: "(prefers-reduced-motion: no-preference)", reducedBySystem: "(prefers-reduced-motion: reduce)" }, (context) => {
    const targets = root.querySelectorAll<HTMLElement>("[data-anim='step']")
    if (!targets.length) return
    if (reducedByUser || context.conditions?.reducedBySystem) {
      gsap.set(targets, { autoAlpha: 1 })
      return
    }
    gsap.fromTo(targets, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.08 })
  })
  return () => mm.revert()
}
