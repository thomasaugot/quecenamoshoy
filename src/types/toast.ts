export type ToastType = "success" | "info" | "warning" | "error"

export type Toast = { id: string; message: string; type: ToastType }

// An error must be READ before it can be acted on; a success only confirms (07-UI_PRIMITIVES).
export const TOAST_DURATION: Record<ToastType, number> = {
  success: 4000, info: 5000, warning: 7000, error: 9000,
}
