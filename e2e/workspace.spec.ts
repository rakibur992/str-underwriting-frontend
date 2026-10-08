import { expect, test } from "@playwright/test"

import { API_BASE_URL } from "./support/env"
import {
  blockImages,
  createDraft,
  expectAllSaved,
  fillUnderwriting,
  TYPICAL_INPUTS,
} from "./support/underwriting"

// Properties used here are never submitted, so other specs' scoring is unaffected.
const BLUE_RIDGE = "74567890" // 215 Aspen Ridge Rd, Blue Ridge, GA
const KISSIMMEE = "63456789" // 3402 Palm Isle Ct, Kissimmee, FL

test.beforeEach(async ({ page }) => {
  await blockImages(page)
})

// A save fired as the page closes can still hit a route handler; don't let it fail the next test.
test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" })
})

test.describe("Underwriting workspace", () => {
  test("shows the brief, previews while typing, autosaves and shows the API's numbers after a reload", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, BLUE_RIDGE)
    await page.goto(`/underwritings/${id}`)

    // Property and market context come first.
    await expect(
      page.getByRole("heading", { level: 1, name: "215 Aspen Ridge Rd" }),
    ).toBeVisible()
    const brief = page.getByRole("region", { name: "Property and market" })
    const draft = await (
      await request.get(`${API_BASE_URL}/api/underwritings/${id}`)
    ).json()
    const market = await (
      await request.get(`${API_BASE_URL}/api/markets/${draft.market_id}`)
    ).json()
    await expect(brief).toContainText(`Market: ${market.name}`)
    await expect(brief).toContainText(market.description)
    // Purchase price is prefilled from the listing; taxes from the training defaults.
    await expect(page.getByLabel("Purchase price")).not.toHaveValue("")
    await expect(page.getByLabel("Tax rate")).toHaveValue("37")

    await fillUnderwriting(page, {
      ...TYPICAL_INPUTS,
      low: "110000",
      mid: "128000",
      high: "145000",
    })
    await expectAllSaved(page)

    // The panel shows exactly what the API saved.
    const saved = await (
      await request.get(`${API_BASE_URL}/api/underwritings/${id}`)
    ).json()
    const usd = (v: string) =>
      `$${Math.round(Number(v)).toLocaleString("en-US")}`
    const results = page.getByRole("complementary")
    await expect(results).toContainText(usd(saved.total_oop))
    await expect(results).toContainText(
      `${Number((Number(saved.m_cash_on_cash) * 100).toFixed(2))}%`,
    )
    await expect(page.getByRole("tab", { name: /Financials/ })).toContainText(
      "Done",
    )

    // Resume: the reload reopens the same section, with everything typed still there.
    await page.reload()
    await expect(page.getByLabel(/^Mid revenue/)).toHaveValue("128,000")
    await page.getByRole("tab", { name: /Financials/ }).click()
    await expect(page.getByLabel("Interest rate")).toHaveValue("6.99")
    await expect(page.getByLabel("Expense 2 name")).toHaveValue("Insurance")
    await expect(results.getByText("Saved results")).toBeVisible()
  })

  test("validates next to the field and per row", async ({ page, request }) => {
    const id = await createDraft(request, KISSIMMEE)
    await page.goto(`/underwritings/${id}`)

    const down = page.getByLabel("Down payment")
    await down.fill("abc")
    await down.blur()
    await expect(down).toHaveAttribute("aria-invalid", "true")
    await expect(page.getByText("Enter a number, like 6.5")).toBeVisible()

    await down.fill("120")
    await expect(
      page.getByText("Enter a down payment between 0 and 100%"),
    ).toBeVisible()

    const term = page.getByLabel("Loan term")
    await term.fill("12.5")
    await term.blur()
    await expect(page.getByText("Enter whole years, like 30")).toBeVisible()
    await expect(page.getByRole("tab", { name: /Financials/ })).toContainText(
      "2 to fix",
    )

    // A half-filled row says what's missing; the section isn't saved meanwhile.
    await page.getByRole("button", { name: "Add expense" }).click()
    await page.getByLabel("Expense 1 name").fill("Internet")
    await page.getByLabel("Expense 1 name").blur()
    const amount = page.getByLabel("Expense 1 monthly amount")
    await amount.focus()
    await amount.blur()
    await expect(page.getByText("Enter the amount")).toBeVisible()
    await expect(
      page.getByRole("status").filter({ hasText: "Not saved yet:" }),
    ).toContainText("Operating expenses")

    // Removing the row clears its error.
    await page.getByRole("button", { name: "Remove expense 1" }).click()
    await expect(page.getByText("Enter the amount")).toHaveCount(0)

    // Low > Mid is a warning, not an error.
    await page.getByRole("tab", { name: /Analysis/ }).click()
    await page.getByLabel(/^Low revenue/).fill("200000")
    await page.getByLabel(/^Mid revenue/).fill("150000")
    await expect(page.getByText(/Low is above Mid/)).toBeVisible()
  })

  test("keeps typed input when a save fails and saves on retry", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, KISSIMMEE)
    let failSaves = true
    await page.route(`**/api/underwritings/${id}`, (route) =>
      route.request().method() === "PUT" && failSaves
        ? route.fulfill({
            status: 500,
            json: { detail: "Database unavailable" },
          })
        : route.continue(),
    )
    await page.goto(`/underwritings/${id}`)

    await page.getByLabel("Down payment").fill("25")
    await page.getByLabel("Interest rate").fill("7.25")
    await page.getByLabel("Loan term").fill("30")
    await page.getByLabel("Closing costs").fill("2.5")

    const status = page.getByRole("status").filter({ hasText: /save/i })
    await expect(status).toContainText("Couldn't save")
    await expect(status).toContainText("Your input is kept")
    await expect(page.getByLabel("Interest rate")).toHaveValue("7.25")

    failSaves = false
    await status.getByRole("button", { name: "Retry" }).click()
    await expect(page.getByText(/^Saved at /)).toBeVisible()
    const saved = await (
      await request.get(`${API_BASE_URL}/api/underwritings/${id}`)
    ).json()
    expect(saved.detail.purchase_details.interest_rate).toBe("0.0725")
  })

  test("never requests a reference underwriting and offers a way back", async ({
    page,
  }) => {
    const requested: string[] = []
    page.on("request", (r) => {
      if (/\/api\/underwritings\/\d+/.test(r.url())) requested.push(r.url())
    })

    // After a seed reset, ids 1–6 are the analyst references.
    for (const id of [1, 987654]) {
      await page.goto(`/underwritings/${id}`)
      await expect(
        page.getByRole("heading", { level: 1, name: "Underwriting not found" }),
      ).toBeVisible()
      await expect(
        page.getByRole("link", { name: "Back to dashboard" }),
      ).toBeVisible()
    }
    expect(requested).toEqual([])
  })

  test("explains how to start the API when it is unreachable", async ({
    page,
  }) => {
    await page.route("**/api/**", (route) => route.abort("connectionrefused"))
    await page.goto("/underwritings/12")
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Couldn't load this underwriting" })
    await expect(alert).toContainText("docker compose up -d --build")
    await expect(alert.getByRole("button", { name: "Retry" })).toBeVisible()
  })

  test("edits and removes list rows and saves deal tags (lists replace, tags send false)", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, BLUE_RIDGE)
    await page.goto(`/underwritings/${id}`)
    const get = async () =>
      (await request.get(`${API_BASE_URL}/api/underwritings/${id}`)).json()

    await page.getByRole("button", { name: "Add item" }).click()
    await page.getByLabel("Item 1 category").fill("Hot tub")
    await page.getByLabel("Item 1 amount").fill("9500")
    await page.getByRole("button", { name: "Add item" }).click()
    await page.getByLabel("Item 2 category").fill("Furniture")
    await page.getByLabel("Item 2 amount").fill("30000")
    await expect(page.getByText("$39,500").first()).toBeVisible()
    await expect(page.getByText(/^Saved at /)).toBeVisible()

    await page.getByRole("button", { name: "Remove item 1" }).click()
    await page.getByLabel("Item 1 amount").fill("32000")
    await expect(page.getByText("$32,000").first()).toBeVisible()
    await expect
      .poll(async () => (await get()).optimization_items)
      .toEqual([
        expect.objectContaining({
          category: "Furniture",
          total_price: "32000.00",
        }),
      ])

    await page.getByRole("tab", { name: /Deal tags/ }).click()
    const turnkey = page.getByRole("switch", { name: "Turnkey" })
    await turnkey.click()
    await expect(turnkey).toBeChecked()
    await expect.poll(async () => (await get()).turnkey).toBe(true)
    await turnkey.click()
    await expect.poll(async () => (await get()).turnkey).toBe(false)
  })

  test("asks before leaving when a save failed", async ({ page, request }) => {
    const id = await createDraft(request, KISSIMMEE)
    await page.route(`**/api/underwritings/${id}`, (route) =>
      route.request().method() === "PUT"
        ? route.fulfill({
            status: 500,
            json: { detail: "Database unavailable" },
          })
        : route.continue(),
    )
    await page.goto(`/underwritings/${id}`)
    await page.getByRole("button", { name: "Add expense" }).click()
    await page.getByLabel("Expense 1 name").fill("Utilities")
    await page.getByLabel("Expense 1 monthly amount").fill("400")
    await expect(page.getByText("Couldn't save")).toBeVisible()

    page.once("dialog", (dialog) => {
      expect(dialog.message()).toContain("aren't saved yet")
      void dialog.dismiss()
    })
    await page.getByRole("link", { name: "Back to dashboard" }).click()
    await expect(page).toHaveURL(new RegExp(`/underwritings/${id}`))
    await expect(page.getByLabel("Expense 1 monthly amount")).toHaveValue("400")
  })

  test("resumes a draft from the dashboard with everything typed", async ({
    page,
    request,
  }) => {
    // The newest draft is the property's active one, so Continue opens this id.
    const id = await createDraft(request, KISSIMMEE)
    await page.goto(`/underwritings/${id}`)
    await page.getByLabel("Down payment").fill("25")
    await page.getByLabel("Interest rate").fill("7.25")
    await page.getByLabel("Loan term").fill("30")
    await page.getByLabel("Closing costs").fill("2.5")
    const expenseSaved = page.waitForResponse(
      (r) =>
        r.request().method() === "PUT" &&
        (r.request().postData() ?? "").includes("Pool service") &&
        r.ok(),
    )
    await page.getByRole("button", { name: "Add expense" }).click()
    await page.getByLabel("Expense 1 name").fill("Pool service")
    await page.getByLabel("Expense 1 monthly amount").fill("350")
    await expenseSaved

    await page.getByRole("link", { name: "Back to dashboard" }).click()
    const street = "3402 Palm Isle Ct"
    const row = page.getByRole("row").filter({ hasText: street })
    await expect(row).toContainText("In progress")
    const posts: string[] = []
    page.on("request", (r) => {
      if (r.method() === "POST") posts.push(r.url())
    })
    await row.getByRole("link", { name: `Continue: ${street}` }).click()

    await expect(page).toHaveURL(new RegExp(`/underwritings/${id}$`))
    await expect(page.getByLabel("Interest rate")).toHaveValue("7.25")
    await expect(page.getByLabel("Expense 1 name")).toHaveValue("Pool service")
    await expect(page.getByLabel("Expense 1 monthly amount")).toHaveValue("350")
    expect(posts).toEqual([])
  })
})
