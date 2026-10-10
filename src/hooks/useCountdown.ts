import { useEffect, useRef, useState } from "react"

// One kitchen timer. Ends with a vibration (phones) and `onDone`. The end time is stored, not
// ticks counted, so a screen that slept still shows the right time when it wakes.
export const useCountdown = (onDone: () => void) => {
  const [remaining, setRemaining] = useState<number | null>(null)
  const endsAt = useRef(0)
  const done = useRef(onDone)
  useEffect(() => { done.current = onDone }, [onDone])

  const running = remaining !== null
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endsAt.current - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) {
        clearInterval(id)
        navigator.vibrate?.([300, 150, 300, 150, 600])
        done.current()
        setRemaining(null)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const start = (seconds: number) => {
    endsAt.current = Date.now() + seconds * 1000
    setRemaining(seconds)
  }
  return { remaining, start, stop: () => setRemaining(null) }
}
