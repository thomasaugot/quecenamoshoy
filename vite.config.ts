import { fileURLToPath, URL } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// Manifest colours are literal hex copied from src/styles/theme.css (bg, primary): a manifest
// cannot read CSS variables (build-progressive-web-app skill §3).
const CREAM = "#faf6ee"

export default defineConfig({
  plugins: [
    react({ compiler: true }),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",            // updates are offered, never forced (UpdatePrompt)
      injectRegister: false,             // UpdatePrompt registers it
      includeAssets: ["assets/icons/favicon.svg", "assets/icons/apple-touch-icon-180x180.png"],
      manifest: {
        id: "/",
        name: "Qué cenamos hoy",
        short_name: "Qué cenamos",
        description: "Tres ideas para cenar esta noche, con lo que te gusta y lo que tienes.",
        lang: "es",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: CREAM,
        theme_color: CREAM,
        icons: [
          { src: "/assets/icons/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/assets/icons/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/assets/icons/maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // The APP only: shell, code, styles, fonts, icons. Never Supabase data, functions or the
        // private photo bucket — those are signed-in data (offline data = persisted query cache).
        globPatterns: ["**/*.{js,css,html,woff2,woff,svg,png,ico,webp}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/\/[^/?]+\.[a-z0-9]+$/i],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },    // a dev worker serves stale code
    }),
  ],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
})
