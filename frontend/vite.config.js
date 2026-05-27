import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",

    coverage: {
      provider: "v8",
      reporter: ["text", "html"]
    }
  }
})