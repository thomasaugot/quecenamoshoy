import { gsap } from "@/lib/gsap"

// Photos land on the page like snapshots pinned to a fridge, then the text rises and a
// handwritten note is scribbled in. Targets ship `invisible` (05-ANIMATIONS).
//   [data-anim="pin"]      photos — drop, settle their tilt
//   [data-anim="rise"]     text blocks — fade up
//   [data-anim="scribble"] handwritten note — pops in last
export const initPinDrop = (root: HTMLElement, reducedByUser: boolean): (() => void) => {
  const mm = gsap.matchMedia(root)
  // matchMedia only calls back when at least ONE condition matches: both sides are listed.
  mm.add({
    motionOk: "(prefers-reduced-motion: no-preference)",
    reducedBySystem: "(prefers-reduced-motion: reduce)",
  }, (context) => {
    const pins = root.querySelectorAll<HTMLElement>("[data-anim='pin']")
    const rises = root.querySelectorAll<HTMLElement>("[data-anim='rise']")
    const scribbles = root.querySelectorAll<HTMLElement>("[data-anim='scribble']")

    if (reducedByUser || context.conditions?.reducedBySystem) {
      const all = [...pins, ...rises, ...scribbles]
      if (all.length) gsap.set(all, { autoAlpha: 1 })
      return
    }

    // A page may have no pins or no scribble: only tween what exists (GSAP warns on empty targets)
    const tl = gsap.timeline()
    if (pins.length) tl.fromTo(pins,
        { autoAlpha: 0, y: -48, scale: 1.08, rotation: (i: number) => (i % 2 === 0 ? -9 : 9) },
        { autoAlpha: 1, y: 0, scale: 1, rotation: 0, duration: 0.7, ease: "back.out(1.5)", stagger: 0.12 })
    if (rises.length) tl.fromTo(rises,
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.55, ease: "power3.out", stagger: 0.08 }, pins.length ? "-=0.45" : 0)
    if (scribbles.length) tl.fromTo(scribbles,
        { autoAlpha: 0, scale: 0.6 },
        { autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.2)" }, "-=0.2")
  })
  return () => mm.revert()
}
