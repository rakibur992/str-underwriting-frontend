# frontend

Next.js (App Router) app for the STR underwriting-training assessment: React 19, TypeScript,
Tailwind CSS 4, shadcn/ui, TanStack Query and a typed `openapi-fetch` client for the FastAPI
backend in [`../backend`](../backend). Project overview, assumptions and tradeoffs are in the root
[README](../README.md).

## Prerequisites

- **Node 24** and npm. The repo root has an `.nvmrc`, so `nvm use` from the root picks it up.
- **Docker with Compose**, to run the API and Postgres.

## Setup

```bash
# 1. Start the API on http://localhost:8000 (interactive docs at /docs)
cd backend
docker compose up -d --build        # first start migrates and seeds the database

# 2. Install and configure the frontend
cd ../frontend
cp .env.example .env.local          # NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm ci

# 3. Run the app on http://localhost:3000
npm run dev
```

Open http://localhost:3000 and press **Start** on any property.

To start again from a clean seed (wipes every attempt): `npm run seed:reset`.

### Environment variables

| Variable                   | Default                      | Used by                                        |
| -------------------------- | ---------------------------- | ---------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000`      | The app, `api:types`, and the e2e global setup |
| `E2E_PORT`                 | `3000`                       | Port Playwright starts Next on                 |
| `E2E_BASE_URL`             | `http://localhost:$E2E_PORT` | URL Playwright tests against                   |

The API allows all CORS origins, so the app works on any port.

## Tests

First time only, install the Playwright browser:

```bash
npx playwright install chromium
```

| Command                   | What it does                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`           | Type-check, lint, format check and Vitest unit tests.                                                                                           |
| `npm run test:e2e`        | Playwright, unattended. Checks the API is up, resets the seed, starts Next (or reuses a running dev server) and runs every spec, one at a time. |
| `npm run test:e2e:report` | Opens the HTML report. Failed tests keep a trace, screenshot and video.                                                                         |

The API must be running before `test:e2e`; the run resets its data. How the fixtures and scoring
cases are built is in [docs/testing-strategy.md](../docs/testing-strategy.md).

## Other scripts

| Command                           | What it does                                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `npm run build` / `npm run start` | Production build and server.                                                                                    |
| `npm run format`                  | Formats everything with Prettier.                                                                               |
| `npm run api:types`               | Regenerates `src/api/generated/` from the live OpenAPI schema (API must be up). Never edit that folder by hand. |
| `npm run fixtures:capture`        | Re-captures the API outputs the calculations unit tests compare against.                                        |

## Troubleshooting

- **`API not reachable at http://localhost:8000`** when running e2e: start the backend with
  `cd ../backend && docker compose up -d --build`.
- **`npm run test:e2e` hangs in global setup:** `docker compose exec` is wedged (the containers show
  "unhealthy"). Once the containers stop, `cd ../backend && docker compose up -d` brings them back.
- **Property photos don't load:** they come from picsum.photos and need network access.

## Layout

```
src/
  app/          routes: /, /underwritings/[id], /underwritings/[id]/review, /submissions/[id]
  features/     dashboard · workspace/{financials,analysis,deal-tags} · review · results
  api/          typed client (generated/ is machine-written), error normaliser, Zod schemas
  lib/          units (fraction ↔ percent), calculations (live preview), format
  components/   shadcn ui, shared display pieces, app shell
e2e/            Playwright specs, fixtures, support helpers
scripts/        API type generation, calculation fixture capture
```

Conventions for working in this folder are in [CLAUDE.md](./CLAUDE.md).
