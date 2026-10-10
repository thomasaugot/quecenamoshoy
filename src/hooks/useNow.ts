import { useSyncExternalStore } from "react"

const MINUTE = 60_000
let snapshot = new Date(Math.floor(Date.now() / MINUTE) * MINUTE)

// A clock that ticks once a minute — Date.now() is never called during render (11-CHECKLIST N).
const subscribe = (onChange: () => void) => {
  const tick = () => {
    snapshot = new Date(Math.floor(Date.now() / MINUTE) * MINUTE)
    onChange()
  }
  const id = setInterval(tick, MINUTE)
  return () => clearInterval(id)
}

export const useNow = () => useSyncExternalStore(subscribe, () => snapshot)
