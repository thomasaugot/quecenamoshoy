import type { PointerEvent } from "react"
import { useRef } from "react"

const MIN_DISTANCE = 50

// Horizontal swipe on a touch screen: left = next, right = previous. Mostly-vertical moves
// (scrolling a long step) are ignored.
export const useSwipe = (onNext: () => void, onPrevious: () => void) => {
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onPointerDown: (e: PointerEvent) => { start.current = { x: e.clientX, y: e.clientY } },
    onPointerUp: (e: PointerEvent) => {
      const from = start.current
      start.current = null
      if (!from) return
      const dx = e.clientX - from.x
      const dy = e.clientY - from.y
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy)) return
      if (dx < 0) onNext()
      else onPrevious()
    },
  }
}
