import { onlineManager } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"

// Online or not, live — the same signal TanStack Query uses to pause its requests
export const useOnline = () => useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline())
