import { gsap } from "@/lib/gsap"

// The wheel spins to `rotation` (total degrees) and settles with a long ease-out, like a real
// wheel losing speed. Reduced motion: it simply turns to the result. Resolves when stopped.
//   [data-anim="wheel"]  the rotating group (inside an SVG, rotates around the wheel centre)
export const spinWheel = (root: HTMLElement, rotation: number, reduced: boolean, origin: string): Promise<void> =>
  new Promise((resolve) => {
    const wheel = root.querySelector<SVGGElement>("[data-anim='wheel']")
    if (!wheel) return resolve()
    gsap.killTweensOf(wheel)
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || prefersReduced) {
      gsap.set(wheel, { rotation, svgOrigin: origin })
      return resolve()
    }
    gsap.to(wheel, {
      rotation, svgOrigin: origin, duration: 4.6, ease: "power4.out",
      onComplete: () => resolve(), onInterrupt: () => resolve(),
    })
  })
