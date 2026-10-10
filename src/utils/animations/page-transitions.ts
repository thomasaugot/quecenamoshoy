import { gsap, ScrollTrigger } from "@/lib/gsap"

// Content crossfade, no overlay (06-TRANSITIONS): exit 180ms, enter 320ms.
export const exitPage = (el: HTMLElement): Promise<void> =>
  new Promise((resolve) => {
    gsap.to(el, {
      opacity: 0, y: 6, duration: 0.18, ease: "power2.in",
      onStart: () => gsap.set(el, { willChange: "opacity, transform" }),
      onComplete: () => resolve(),
      onInterrupt: () => resolve(),
    })
  })

export const enterPage = (el: HTMLElement): Promise<void> =>
  new Promise((resolve) => {
    gsap.fromTo(el, { opacity: 0, y: 28 }, {
      opacity: 1, y: 0, duration: 0.32, ease: "power3.out",
      onStart: () => gsap.set(el, { willChange: "opacity, transform" }),
      // a leftover transform — even translateY(0) — breaks position:fixed descendants
      onComplete: () => {
        gsap.set(el, { clearProps: "transform,willChange" })
        resolve()
      },
      onInterrupt: () => resolve(),
    })
  })

export const killAllAnimations = (el: HTMLElement | null): void => {
  if (!el) return
  gsap.killTweensOf(el.querySelectorAll("*"))
  ScrollTrigger.getAll().forEach((trigger) => {
    const target = trigger.trigger
    if (target instanceof Element && el.contains(target)) trigger.kill()
  })
}
