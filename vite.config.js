import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "Life Cost App",
        short_name: "LifeCost",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/"
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ]
})
