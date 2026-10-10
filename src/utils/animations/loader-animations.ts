import { gsap } from "@/lib/gsap"

const q = (root: HTMLElement, name: string) => root.querySelector<HTMLElement>(`[data-anim="${name}"]`)
const qa = (root: HTMLElement, name: string) => [...root.querySelectorAll<HTMLElement>(`[data-anim="${name}"]`)]

const spins = new WeakMap<HTMLElement, gsap.core.Timeline>()

// The slip slides in over yesterday's, a tack pins it, each line is written left to right
// (a clip that opens like ink), and the dish spins like the roulette until the app is ready.
export const initLoader = (root: HTMLElement, reducedByUser: boolean): (() => void) => {
  const ctx = gsap.context(() => {
    const back = q(root, "loader-slip-back")
    const slip = q(root, "loader-slip")
    const tack = q(root, "loader-tack")
    const lines = qa(root, "loader-write")
    const dishes = qa(root, "loader-dish")
    if (!slip || !back || !tack) return
    if (reducedByUser || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([back, slip, tack, ...lines, dishes[0] ?? []], { autoAlpha: 1 })
      return
    }

    gsap.timeline()
      .fromTo(back, { autoAlpha: 1, y: "60svh", rotation: 14 }, { y: 0, rotation: 3, duration: 0.5, ease: "power3.out" })
      .fromTo(slip, { autoAlpha: 1, y: "70svh", rotation: -14 }, { y: 0, rotation: -2, duration: 0.55, ease: "power3.out" }, "-=0.4")
      .fromTo(tack, { autoAlpha: 0, scale: 2.4, y: -18 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.3, ease: "power3.in" }, "-=0.1")
      .to(slip, { rotation: -2.6, duration: 0.09, yoyo: true, repeat: 1, ease: "power1.out" })
      .fromTo(lines, { autoAlpha: 1, clipPath: "inset(-20% 100% -20% 0)" },
        { clipPath: "inset(-20% 0% -20% 0)", duration: 0.3, stagger: 0.1, ease: "power1.inOut" }, "-=0.1")

    const spin = gsap.timeline({ repeat: -1, delay: 0.95 })
    dishes.forEach((dish) => {
      spin.fromTo(dish, { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 0.14, ease: "power2.out" })
        .to(dish, { autoAlpha: 0, yPercent: -40, duration: 0.14, ease: "power2.in" }, "+=0.1")
    })
    gsap.to(root.querySelectorAll("[data-part='loader-dot']"),
      { y: -5, duration: 0.3, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.12 })
    spins.set(root, spin)
  }, root)
  return () => {
    spins.delete(root)
    ctx.revert()
  }
}

// The dish lands, then the slip is torn off the tack and flies up and away, yesterday's slip
// after it, while the ground fades — serving the app.
export const exitLoader = (root: HTMLElement, reduced: boolean, onComplete: () => void): void => {
  const back = q(root, "loader-slip-back")
  const slip = q(root, "loader-slip")
  const tack = q(root, "loader-tack")
  const ground = root.querySelector<HTMLElement>("[data-part='loader-ground']")
  const dishes = qa(root, "loader-dish")
  if (reduced || !slip) {
    gsap.to(root, { autoAlpha: 0, duration: 0.25, onComplete })
    return
  }
  spins.get(root)?.kill()
  const landed = dishes[dishes.length - 1]
  // the spin was killed mid-flick: reset every dish's offset, or the last one lands off its line
  gsap.set(dishes, { autoAlpha: 0, yPercent: 0 })

  gsap.timeline({ onComplete })
    .fromTo(landed ?? [], { autoAlpha: 1, yPercent: 0, scale: 0.4 }, { yPercent: 0, scale: 1, duration: 0.4, ease: "back.out(3)" })
    .to(tack ?? [], { y: -14, autoAlpha: 0, duration: 0.2, ease: "power2.in" }, "+=0.15")
    .to(slip, { rotation: 6, duration: 0.18, ease: "power2.out" }, "<")
    .to(slip, { y: "-110svh", x: "18vw", rotation: 24, duration: 0.65, ease: "power3.in" })
    .to(back ?? [], { y: "-110svh", x: "-10vw", rotation: -16, duration: 0.65, ease: "power3.in" }, "<0.08")
    .to(ground ?? [], { autoAlpha: 0, duration: 0.4, ease: "power2.out" }, "<0.3")
}
