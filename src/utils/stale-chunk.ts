const KEY = "chunk-reload-at"
const WINDOW_MS = 10_000

// After a deploy, an open tab asks for chunks that no longer exist. Reload once (at most every
// 10 s, so a genuinely missing chunk cannot loop) to fetch the new index.html (13-MONITORING).
export const reloadOnStaleChunk = () => {
  window.addEventListener("vite:preloadError", (event) => {
    let last = 0
    try { last = Number(sessionStorage.getItem(KEY) ?? 0) } catch { /* storage blocked */ }
    if (Date.now() - last < WINDOW_MS) return
    event.preventDefault()
    try { sessionStorage.setItem(KEY, String(Date.now())) } catch { /* storage blocked */ }
    window.location.reload()
  })
}
