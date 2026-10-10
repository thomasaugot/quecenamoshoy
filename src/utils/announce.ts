// Writes into the LiveRegion mounted once in Providers (07-UI_PRIMITIVES).
export const announce = (message: string, politeness: "polite" | "assertive" = "polite") => {
  const el = document.getElementById(politeness === "assertive" ? "live-assertive" : "live-polite")
  if (!el) return
  el.textContent = ""
  requestAnimationFrame(() => { el.textContent = message })
}
