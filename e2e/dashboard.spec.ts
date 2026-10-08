import { expect, test, type Page } from "@playwright/test"

import { SEED_PROPERTIES } from "./fixtures/seed-properties"
import { blockImages } from "./support/underwriting"

const streetOf = (address: string) => address.split(",")[0]!

function rowFor(page: Page, street: string) {
  return page.getByRole("row").filter({ hasText: street })
}

// Real-API specs here rely on the seed reset in global-setup (fresh "0 of 6")
// and leave one in-progress draft on 88 Lakeshore Ln behind for later specs.
test.beforeEach(async ({ page }) => {
  await blockImages(page)
})

test.describe("Training dashboard", () => {
  test("lists the six seed properties, starts a case and resumes the same draft", async ({
    page,
  }) => {
    await page.goto("/")

    const table = page.getByRole("table")
    await expect(table.getByRole("row")).toHaveCount(SEED_PROPERTIES.length + 1)
    for (const p of SEED_PROPERTIES) {
      const row = rowFor(page, streetOf(p.address))
      await expect(row).toBeVisible()
      // Decorative photo (alt=""), so it has no img role to locate by.
      await expect(row.locator("img")).toHaveCount(1)
    }
    await expect(page.getByText("0 of 6 cases scored")).toBeVisible()

    const street = "88 Lakeshore Ln"
    const row = rowFor(page, street)
    await expect(row).toContainText("Not started")
    await row.getByRole("button", { name: `Start: ${street}` }).click()

    await expect(page).toHaveURL(/\/underwritings\/\d+$/)
    const draftUrl = page.url()
    await expect(
      page.getByRole("heading", { level: 1, name: street }),
    ).toBeVisible()

    await page.getByRole("link", { name: "Back to dashboard" }).click()
    await expect(row).toContainText("In progress")

    // Continue reuses active_underwriting_id instead of creating a duplicate.
    const posts: string[] = []
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url())
    })
    await row.getByRole("link", { name: `Continue: ${street}` }).click()
    await expect(page).toHaveURL(draftUrl)
    expect(posts).toEqual([])
  })

  test("explains how to start the API when it is unreachable, then recovers on retry", async ({
    page,
  }) => {
    let offline = true
    await page.route("**/api/dashboard", (route) =>
      offline ? route.abort("connectionrefused") : route.continue(),
    )
    await page.goto("/")

    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Couldn't load your training cases" })
    await expect(alert).toBeVisible()
    await expect(alert).toContainText("docker compose up -d --build")

    offline = false
    await page.getByRole("button", { name: "Retry" }).click()
    await expect(page.getByRole("table").getByRole("row")).toHaveCount(
      SEED_PROPERTIES.length + 1,
    )
  })

  test("keeps the trainee on the dashboard when starting a case fails", async ({
    page,
  }) => {
    await page.route("**/api/underwritings", (route) =>
      route.request().method() === "POST"
        ? route.fulfill({
            status: 500,
            json: { detail: "Failed to start underwriting" },
          })
        : route.continue(),
    )
    await page.goto("/")

    const street = "9 Dune Walk"
    await rowFor(page, street)
      .getByRole("button", { name: `Start: ${street}` })
      .click()

    const alert = page
      .getByRole("alert")
      .filter({ hasText: `Couldn't start ${street}` })
    await expect(alert).toBeVisible()
    await expect(alert).toContainText("Failed to start underwriting")
    await expect(page).toHaveURL("/")
  })

  test("shows scores and result actions for a submitted case, without reference numbers", async ({
    page,
  }) => {
    const submitted = SEED_PROPERTIES[0]!
    // Mocked so the run never submits (the real submit flow is covered later).
    await page.route("**/api/dashboard", async (route) => {
      const response = await route.fetch()
      const body = await response.json()
      body.summary = {
        ...body.summary,
        submitted: 1,
        not_started: body.summary.not_started - 1,
        average_accuracy: "70.00",
      }
      body.properties = body.properties.map((p: { zpid: string }) =>
        p.zpid === submitted.zpid
          ? {
              ...p,
              status: "submitted",
              attempts: 2,
              latest_rating: "medium",
              latest_accuracy: "70.00",
              best_rating: "best",
              best_accuracy: "100.00",
              active_underwriting_id: null,
              latest_submission_id: 99,
            }
          : p,
      )
      await route.fulfill({ response, json: body })
    })
    await page.goto("/")

    const street = streetOf(submitted.address)
    const row = rowFor(page, street)
    await expect(row).toContainText("Submitted")
    await expect(row).toContainText("Medium · 70")
    await expect(row).toContainText("Best · 100")
    await expect(
      row.getByRole("button", { name: `Try again: ${street}` }),
    ).toBeVisible()
    await expect(page.getByText("1 of 6 cases scored")).toBeVisible()

    // Never show the analyst's numbers or the score bands.
    const money = (n: number) => `$${n.toLocaleString("en-US")}`
    for (const p of SEED_PROPERTIES) {
      for (const n of [p.referenceMid, ...p.best, ...p.medium]) {
        await expect(page.getByText(money(n))).toHaveCount(0)
      }
    }

    await row.getByRole("link", { name: `View result: ${street}` }).click()
    await expect(page).toHaveURL("/submissions/99")
    // Submission 99 doesn't exist in this run; the page says so and links back.
    await expect(
      page.getByRole("heading", { level: 1, name: "Result not found" }),
    ).toBeVisible()
  })
})
