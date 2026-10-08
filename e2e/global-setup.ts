import { execFileSync } from "node:child_process"
import path from "node:path"

import { API_BASE_URL } from "./support/env"

const BACKEND_DIR = path.resolve(__dirname, "..", "..", "backend")

export default async function globalSetup() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`)
    if (!res.ok) throw new Error(`status ${res.status}`)
  } catch (error) {
    throw new Error(
      `API not reachable at ${API_BASE_URL} (${String(error)}).\n` +
        "Start it first: cd backend && docker compose up -d --build",
    )
  }

  // Wipes every attempt and reseeds markets, properties and references.
  execFileSync(
    "docker",
    ["compose", "exec", "-T", "api", "python", "-m", "scripts.seed", "--reset"],
    { cwd: BACKEND_DIR, stdio: "inherit" },
  )
}
