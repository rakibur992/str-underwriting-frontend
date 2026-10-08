import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Unit tests cover pure modules (lib/units, lib/calculations, api mappers).
    // UI behaviour is covered end-to-end by Playwright.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
