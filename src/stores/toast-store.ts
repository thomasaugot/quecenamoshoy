import { create } from "zustand"
import type { Toast, ToastType } from "@/types/toast"

type ToastState = {
  toasts: Toast[]
  push: (message: string, type: ToastType) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  // Dedupe in the STORE: StrictMode and re-runs raise the same toast twice (07-UI_PRIMITIVES).
  push: (message, type) =>
    set((state) =>
      state.toasts.some((t) => t.message === message && t.type === type)
        ? state
        : { toasts: [...state.toasts, { id: crypto.randomUUID(), message, type }] },
    ),
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

export const showToast = (message: string, type: ToastType = "info") =>
  useToastStore.getState().push(message, type)
