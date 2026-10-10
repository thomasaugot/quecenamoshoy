import { gsap } from "@/lib/gsap"

// The lid is lifted the way a hand would: straight up by the knob with a tilt back, held over
// the dish with a small bob, then set down with a soft clink — and while it is down the dish
// underneath changes. Loops forever.
//   [data-part="cloche-lid"]   the lid's layers, moved as one: its shell, the mask that hides the
//                              dish behind that shell, and the front of its base ring
//   [data-anim="cloche-dish"]  the dishes; the current one is always visible
//   [data-anim="cloche-rim"]   the inside of the dome, glimpsed while the lid is up

const LIFT = { y: -44, rotation: -14 }   // its bottom edge just clears the dish

export const initClocheReveal = (root: HTMLElement, reducedByUser: boolean): (() => void) => {
  const mm = gsap.matchMedia(root)
  // matchMedia only calls back when at least ONE condition matches: both sides are listed.
  mm.add({ motionOk: "(prefers-reduced-motion: no-preference)", reducedBySystem: "(prefers-reduced-motion: reduce)" }, (context) => {
    const lid = [...root.querySelectorAll<SVGGElement>("[data-part='cloche-lid']")]
    const dishes = [...root.querySelectorAll<SVGElement>("[data-anim='cloche-dish']")]
    // the dome's dark inside, and the opening in the dish's mask: they appear and go together
    const rim = [...root.querySelectorAll<SVGEllipseElement>("[data-anim='cloche-rim']")]
    if (lid.length === 0 || dishes.length === 0) return

    // Pivot = the middle of the lid's base, in SVG units: the tilt happens around where a hand
    // holds it, and setting it down (y 0, rotation 0) lands exactly where it was drawn.
    gsap.set(lid, { svgOrigin: "60 72" })
    gsap.set([...dishes, ...rim], { autoAlpha: 0 })
    gsap.set(dishes[0] ?? [], { autoAlpha: 1 })

    if (reducedByUser || context.conditions?.reducedBySystem) {
      gsap.set(lid, LIFT)   // still life: lid held up over one dish
      gsap.set(rim, { autoAlpha: 1 })
      return
    }

    let index = 0
    const next = () => {
      gsap.set(dishes[index] ?? [], { autoAlpha: 0 })
      index = (index + 1) % dishes.length
      gsap.set(dishes[index] ?? [], { autoAlpha: 1 })
    }

    gsap.timeline({ repeat: -1, repeatDelay: 0.5, onRepeat: next })
      // a short unstick, then the lift
      .to(lid, { y: -2, duration: 0.12, ease: "power1.out" })
      .to(lid, { ...LIFT, duration: 0.7, ease: "power3.out" })
      .to(rim, { autoAlpha: 1, duration: 0.25, ease: "power1.out" }, "<0.1")
      // held in the air: it breathes a little
      .to(lid, { y: LIFT.y + 2.5, rotation: LIFT.rotation + 2, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 1 })
      // set back down
      .to(lid, { y: 0, rotation: 0, duration: 0.5, ease: "power2.in" }, "+=0.2")
      .to(rim, { autoAlpha: 0, duration: 0.15, ease: "power1.in" }, ">-0.2")
      .to(lid, { y: -1.2, duration: 0.07, yoyo: true, repeat: 1, ease: "power1.out" })
  })
  return () => mm.revert()
}
