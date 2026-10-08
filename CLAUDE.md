# frontend/: Next.js app

Next.js 16.4 (App Router, `cacheComponents` on), React 19, TypeScript strict, Tailwind v4, shadcn
(radix-nova), TanStack Query, React Hook Form + Zod, openapi-fetch, Vitest, Playwright. Node 24.
Next 16 differs from older training data; see `AGENTS.md` (bundled docs in `node_modules/next/dist/docs/`).

## Commands

```bash
npm run dev            # :3000 (API must be on :8000)
npm run check          # typecheck + lint + format:check + unit tests
npm run test:e2e       # Playwright, resets the seed first, unattended
npm run test:e2e:report
npm run api:types      # regenerate src/api/generated from the live schema
npm run fixtures:capture  # rebuild the lib/calculations oracle from API drafts (then seed:reset)
npm run seed:reset
npx shadcn@latest add <component>
```

## Layout

- `src/app/`: routes only. Thin pages that compose feature components; `loading.tsx` / `error.tsx` where useful.
- `src/features/<feature>/`: `components/`, `hooks/` (queries/mutations), `schema.ts` (Zod form schema),
  `mappers.ts` (API ↔ view model). Features: dashboard, workspace/{financials,analysis,deal-tags}, review, results.
- `src/api/`: typed client, error normaliser, Zod schemas for untyped `detail.*`, query keys.
  **`src/api/generated/` is machine-written. Never edit it; run `npm run api:types`.**
- `src/lib/units/`: **the only place** that converts fraction ↔ whole percent and decimal string ↔ number.
- `src/lib/calculations/`: pure formula module for live previews (tested against API outputs).
- `src/components/ui/`: shadcn components + shared display primitives. Don't fork shadcn files per feature.
- One component per file. Name files in kebab-case and components in PascalCase. Prefer small files over long ones.

## Components

- Server Components by default; add `"use client"` at the smallest leaf that needs state, effects or queries.
- Data-backed screens are client components using TanStack Query, so Playwright can mock every request.
- Every data view handles **loading** (skeleton), **empty**, and **error** (message + retry) states.
- Accessible by default: real labels, `aria-invalid` + described-by errors, visible focus, keyboard reachable.

## Forms

- React Hook Form + `zodResolver(schema)`; shadcn form/field components for label, control and message.
- Form state holds **the text typed** (whole-number percents, "650,000"). Convert to API fractions and
  decimal strings in the feature's `mappers.ts` via `lib/units` (`parseUserNumber`, `percentToFraction`).
- The underwriting form lives in `WorkspaceProvider` (route layout), shared by workspace and review.
  Field labels, ranges and messages come from `features/workspace/fields.ts` (ADR-0009, 0011).
- `useFieldArray` for optimization items and OPEX. The API replaces the whole list on save.
- Validation messages say what to fix ("Enter a down payment between 0 and 100%").

## Data fetching

- One hook per query/mutation in `features/*/hooks/`, keys from `src/api/query-keys.ts`.
- Map API errors through the shared normaliser: `detail` may be a string **or** an array (422).
- After submit, write the returned `dashboard` into the cache (`setQueryData`); don't refetch blindly.
- Never request an underwriting with `is_reference: true`. Reuse `active_underwriting_id` instead of POSTing duplicates.
- The API's saved numbers replace live previews after every save.

## Styling

- Tailwind utilities + shadcn tokens from `globals.css` (`bg-background`, `text-muted-foreground`, …). No hex values in components.
- Numbers: `tabular-nums`, right-aligned in tables, currency without cents for large amounts, percents to 1–2 dp.
- Merge classes with `cn()` from `@/lib/utils`. Variants via `cva`.
- Prettier (no semicolons) + prettier-plugin-tailwindcss; the PostToolUse hook formats and lints edited files.

## Testing

- Unit: Vitest, `src/**/*.test.ts`, pure modules only. `expectTypeOf` is enforced by `npm run typecheck`.
- E2E: `e2e/*.spec.ts`; data in `e2e/fixtures/`; helpers in `e2e/support/`. Use role/label locators.
  Real API after seed reset for flows; `page.route` mocks for 500/slow/offline. See the `playwright-case` skill.

## Gotchas

- Tailwind is compiled via `@tailwindcss/turbopack` (no postcss config).
- `cacheComponents: true`: uncached dynamic data in Server Components must sit under `<Suspense>`.
- `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`) defaults to http://localhost:8000.
- Seed images come from picsum.photos (allowed in `next.config.ts`); route or block them in e2e.
- A page whose layout waits for client data needs `export const instant = false` (Next 16 instant-navigation validation).
- `react-hooks/refs` flags `field.value` from `useController`; destructure `{ field: { ref, value, onChange, onBlur } }`.
  Use `useWatch` rather than `form.watch()` (compiler lint).
- `cacheComponents` keeps the previous route mounted but hidden: in e2e, text on both pages can match
  twice; scope to the element (`toHaveAccessibleDescription`, role-scoped locators).
- Don't let a message appear or vanish on blur above the pointer: it shifts layout and swallows the click.
- A long-running `npm run dev` can keep serving an old `globals.css` (tokens missing, grey badges).
  Restart it, or check with `npm run build && npx next start -p 3100`.
- Use Node 24 (`~/.nvm/versions/node/v24*/bin` on PATH); the shell default may be older.
- `npx shadcn add` prompts to overwrite `button.tsx`; pipe `yes n |` to keep ours.
