import { expect, test } from "@playwright/test"

import { SEED_PROPERTIES, type SeedProperty } from "./fixtures/seed-properties"
import { API_BASE_URL } from "./support/env"
import {
  blockImages,
  createDraft,
  expectAllSaved,
  fillUnderwriting,
  fullPayload,
  submitFromWorkspace,
  TYPICAL_INPUTS,
  usd,
} from "./support/underwriting"

/**
 * Scoring, driven by the brief's seed score table (e2e/fixtures/seed-properties.ts),
 * never by the reference underwritings. Bands are inclusive.
 */
const byZpid = (zpid: string) => SEED_PROPERTIES.find((p) => p.zpid === zpid)!
const streetOf = (p: SeedProperty) => p.address.split(",")[0]!

type Tier = { rating: "Best" | "Medium" | "Low"; score: number }
const BEST: Tier = { rating: "Best", score: 100 }
const MEDIUM: Tier = { rating: "Medium", score: 70 }
const LOW: Tier = { rating: "Low", score: 40 }

test.beforeEach(async ({ page }) => {
  await blockImages(page)
})

// One full UI run each for Medium and Low; the primary path below covers Best.
const FULL_RUNS = [
  { zpid: "52345678", factor: 0.8, tier: MEDIUM, sentence: "20.0% below" },
  { zpid: "74567890", factor: 1.5, tier: LOW, sentence: "50.0% above" },
]

test.describe("Scoring: full runs below Best", () => {
  for (const run of FULL_RUNS) {
    const property = byZpid(run.zpid)
    const mid = Math.round(property.referenceMid * run.factor)

    test(`${streetOf(property)}: Mid ${usd(mid)} scores ${run.tier.rating} · ${run.tier.score}`, async ({
      page,
      request,
    }) => {
      const id = await createDraft(request, run.zpid)
      await page.goto(`/underwritings/${id}`)
      await fillUnderwriting(page, {
        ...TYPICAL_INPUTS,
        low: String(Math.round(mid * 0.85)),
        mid: String(mid),
        high: String(Math.round(mid * 1.15)),
      })
      await expectAllSaved(page)
      await submitFromWorkspace(page)

      const score = page.getByRole("region", { name: "Your score" })
      await expect(score).toContainText(String(run.tier.score))
      await expect(score).toContainText(run.tier.rating)
      await expect(score).toContainText(
        `You were ${run.sentence} the analyst's Mid revenue.`,
      )
      await expect(score).toContainText(usd(mid))
      await expect(score).toContainText(usd(property.referenceMid))

      // Tier thresholds for context, from the reference (only shown after submitting).
      const ladder = page.getByRole("region", { name: "Where you landed" })
      await expect(ladder).toContainText(
        `${usd(property.best[0])} – ${usd(property.best[1])}`,
      )
      await expect(ladder).toContainText(
        `${usd(property.medium[0])} – ${usd(property.medium[1])}`,
      )

      // Standing ranks the trainee's own attempts, with this property's record, and
      // says plainly that a cross-trainee leaderboard isn't available (ADR-0005).
      const standing = page.getByRole("region", { name: "Your standing" })
      await expect(standing).toContainText(
        /This attempt ranks #\d+ of \d+ of your attempts/,
      )
      const record = standing.getByLabel("This property")
      await expect(record).toContainText(/\d+ attempts?/)
      await expect(record).toContainText("Latest")
      await expect(standing).toContainText("leaderboard endpoint")
    })
  }
})

test("primary path: start from the dashboard, submit, and try the property again", async ({
  page,
}) => {
  const property = byZpid("41234567")
  const street = streetOf(property)
  await page.goto("/")
  const row = page.getByRole("row").filter({ hasText: street })
  // A run before this one may have left this property submitted or with a draft.
  await row
    .getByRole("button", { name: `Start: ${street}` })
    .or(row.getByRole("button", { name: `Try again: ${street}` }))
    .or(row.getByRole("link", { name: `Continue: ${street}` }))
    .first()
    .click()
  await expect(page).toHaveURL(/\/underwritings\/\d+$/)
  await expect(
    page.getByRole("heading", { level: 1, name: street }),
  ).toBeVisible()

  await fillUnderwriting(page, {
    ...TYPICAL_INPUTS,
    low: "100000",
    mid: String(property.referenceMid),
    high: "150000",
  })
  await expectAllSaved(page)
  await submitFromWorkspace(page)
  await expect(page.getByRole("region", { name: "Your score" })).toContainText(
    "You matched the analyst's Mid revenue exactly.",
  )
  await expect(
    page
      .getByRole("region", { name: "Where you landed" })
      .locator("tr[aria-current]"),
  ).toContainText("Best")

  // Try again starts a fresh draft; the dashboard then offers Continue and the last result.
  await page.getByRole("button", { name: "Try this property again" }).click()
  await expect(page).toHaveURL(/\/underwritings\/\d+$/)
  await expect(page.getByLabel("Down payment")).toHaveValue("")
  await page.getByRole("link", { name: "Back to dashboard" }).click()
  await expect(row).toContainText("In progress")
  await row.getByRole("link", { name: `Last result: ${street}` }).click()
  await expect(page.getByRole("region", { name: "Your score" })).toContainText(
    "Best",
  )
})

// The brief's inclusive limits: each edge, and one dollar outside it, for every seed
// property. Set up through the API so the matrix stays fast.
const BOUNDARIES = [
  {
    label: "Best upper edge (exactly +10%)",
    mid: (p: SeedProperty) => p.best[1],
    tier: BEST,
  },
  {
    label: "just above Best",
    mid: (p: SeedProperty) => p.best[1] + 1,
    tier: MEDIUM,
  },
  {
    label: "Medium lower edge (exactly −25%)",
    mid: (p: SeedProperty) => p.medium[0],
    tier: MEDIUM,
  },
  {
    label: "just below Medium",
    mid: (p: SeedProperty) => p.medium[0] - 1,
    tier: LOW,
  },
]

test("scoring boundaries are inclusive for every seed property", async ({
  request,
}) => {
  for (const property of SEED_PROPERTIES) {
    for (const c of BOUNDARIES) {
      const mid = c.mid(property)
      const label = `${streetOf(property)}, ${c.label}`
      const id = await createDraft(request, property.zpid)
      const res = await request.post(
        `${API_BASE_URL}/api/underwritings/${id}/submit`,
        { data: fullPayload(mid) },
      )
      expect(res.ok(), `${label}: submit`).toBe(true)
      const { submission } = await res.json()
      expect(
        [submission.rating, Number(submission.accuracy)],
        `${label}: Mid ${usd(mid)}`,
      ).toEqual([c.tier.rating.toLowerCase(), c.tier.score])
    }
  }
})
