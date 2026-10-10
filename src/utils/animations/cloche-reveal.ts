import { gsap } from "@/lib/gsap"

// The lid lifts on its left edge, holds over a dish, drops back with a small clink — and
// while it is closed the dish underneath changes. Loops forever.
//   [data-part="cloche-lid"]   the dome + knob (visible at rest, only rotates)
//   [data-anim="cloche-dish"]  the dish icons, one shown at a time

export const initClocheReveal = (root: HTMLElement, reducedByUser: boolean): (() => void) => {
  const mm = gsap.matchMedia(root)
  // matchMedia only calls back when at least ONE condition matches: both sides are listed.
  mm.add({ motionOk: "(prefers-reduced-motion: no-preference)", reducedBySystem: "(prefers-reduced-motion: reduce)" }, (context) => {
    const lid = root.querySelector<SVGGElement>("[data-part='cloche-lid']")
    const dishes = [...root.querySelectorAll<SVGSVGElement>("[data-anim='cloche-dish']")]
    if (!lid || dishes.length === 0) return

    // Hinge = the left end of the plate rim (x 0%, y 88% of the lid's box: rim at 74 in 25.5–80.5), set ONCE. Tweens then move only rotation/y, so
    // closing (rotation 0, y 0) lands exactly where the lid was drawn — no origin drift.
    gsap.set(lid, { transformOrigin: "0% 88%" })

    let index = 0
    gsap.set(dishes, { autoAlpha: 0 })
    gsap.set(dishes[0] ?? [], { autoAlpha: 1 })

    if (reducedByUser || context.conditions?.reducedBySystem) {
      gsap.set(lid, { rotation: -24, y: -6 })   // still life: lid open, one dish
      return
    }

    const nextDish = () => {
      gsap.set(dishes[index] ?? [], { autoAlpha: 0 })
      index = (index + 1) % dishes.length
      gsap.set(dishes[index] ?? [], { autoAlpha: 1 })
    }

    gsap.timeline({ repeat: -1, repeatDelay: 0.5, onRepeat: nextDish })
      .to(lid, { rotation: -26, y: -8, duration: 0.65, ease: "back.out(1.6)" })
      .to(lid, { rotation: -22, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 })
      .to(lid, { rotation: 0, y: 0, duration: 0.42, ease: "power3.in" }, "+=0.35")
      .to(lid, { y: -1.5, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" })
  })
  return () => mm.revert()
}
