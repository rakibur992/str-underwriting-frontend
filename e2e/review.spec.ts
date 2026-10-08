import { expect, test } from "@playwright/test"

import { API_BASE_URL } from "./support/env"
import {
  blockImages,
  createDraft,
  expectAllSaved,
  fillUnderwriting,
  TYPICAL_INPUTS,
} from "./support/underwriting"

// Drafts only (never submitted) for validation and error cases.
const PORT_ARANSAS = "85678901" // 9 Dune Walk
// Submitted once by the happy path; no other draft is opened on it in this file.
const SEVIERVILLE = "96789012" // 47 Cedar Hollow Rd

test.beforeEach(async ({ page }) => {
  await blockImages(page)
})

test.afterEach(async ({ page }) => {
  await page.unrouteAll({ behavior: "ignoreErrors" })
})

test.describe("Review and submission", () => {
  test("blocks submit until required inputs are valid, and links each item to its field", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, PORT_ARANSAS)
    await page.goto(`/underwritings/${id}/review`)

    await expect(
      page.getByRole("heading", { level: 1, name: "Review and submit" }),
    ).toBeVisible()
    const submit = page.getByRole("button", { name: "Submit underwriting" })
    await expect(submit).toBeDisabled()
    await expect(
      page.getByText(/Fix the 7 items in the checklist/),
    ).toBeVisible()
    await expect(
      page.getByText("7 things to fix before you can submit"),
    ).toBeVisible()

    // Empty lists are visible, not silently accepted.
    await expect(page.getByRole("list", { name: "Warnings" })).toContainText(
      "Operating expenses",
    )

    // The link opens the right section and focuses the field.
    await page
      .getByRole("list", { name: "Financials: to fix" })
      .getByRole("link", { name: /Interest rate/ })
      .click()
    await expect(page).toHaveURL(
      /section=financials&field=purchase\.interestRatePct/,
    )
    const rate = page.getByLabel("Interest rate")
    await expect(rate).toBeFocused()
    // (getByText would also match the hidden, preserved review route.)
    await expect(rate).toHaveAccessibleDescription(/Enter the interest rate/)

    // Fixing everything enables submit.
    await fillUnderwriting(page, {
      ...TYPICAL_INPUTS,
      low: "170000",
      mid: "190000",
      high: "215000",
    })
    await expectAllSaved(page)
    await page.getByRole("link", { name: "Review & submit" }).first().click()
    await expect(
      page.getByText("Every required input is filled in and valid."),
    ).toBeVisible()
    await expect(submit).toBeEnabled()
    // Read-only summary of what will be submitted.
    await expect(
      page.getByRole("region", { name: "Your inputs" }),
    ).toContainText("$190,000")
  })

  test("maps the API's missing-sections 422 onto the checklist and keeps the draft", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, PORT_ARANSAS)
    await page.goto(`/underwritings/${id}`)
    await fillUnderwriting(page, {
      ...TYPICAL_INPUTS,
      low: "1",
      mid: "2",
      high: "3",
    })
    await expectAllSaved(page)

    await page.route(`**/api/underwritings/${id}/submit`, (route) =>
      route.fulfill({
        status: 422,
        json: { detail: "Missing required sections: purchase_details, taxes" },
      }),
    )
    await page.getByRole("link", { name: "Review & submit" }).first().click()
    await page.getByRole("button", { name: "Submit underwriting" }).click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Submit" })
      .click()

    const financials = page.getByRole("list", { name: "Financials: to fix" })
    await expect(financials).toContainText("Purchase & financing")
    await expect(financials).toContainText("Taxes")
    await expect(financials).toContainText(
      "The API says this section is missing",
    )
    await expect(
      page.getByRole("button", { name: "Submit underwriting" }),
    ).toBeDisabled()
    await expect(page).toHaveURL(new RegExp(`/underwritings/${id}/review$`))

    // Following the link and changing anything clears the API's verdict, so Submit works again.
    await financials.getByRole("link", { name: /Taxes/ }).click()
    await expect(page.getByLabel("Land")).toBeFocused()
    await page.getByLabel("Tax rate").fill("36")
    await page.getByRole("link", { name: "Review & submit" }).first().click()
    await expect(
      page.getByRole("button", { name: "Submit underwriting" }),
    ).toBeEnabled()
  })

  test("shows a server error without losing anything and lets the trainee retry", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, PORT_ARANSAS)
    await page.goto(`/underwritings/${id}`)
    await fillUnderwriting(page, {
      ...TYPICAL_INPUTS,
      low: "1",
      mid: "2",
      high: "3",
    })
    await expectAllSaved(page)

    await page.route(`**/api/underwritings/${id}/submit`, (route) =>
      route.fulfill({
        status: 500,
        json: { detail: "Failed to submit underwriting" },
      }),
    )
    await page.getByRole("link", { name: "Review & submit" }).first().click()
    const submit = page.getByRole("button", { name: "Submit underwriting" })
    await submit.click()
    await page
      .getByRole("alertdialog")
      .getByRole("button", { name: "Submit" })
      .click()

    await expect(
      page.getByRole("alert").filter({ hasText: "Couldn't submit" }),
    ).toContainText("Failed to submit underwriting")
    await expect(submit).toBeEnabled()
    const saved = await (
      await request.get(`${API_BASE_URL}/api/underwritings/${id}`)
    ).json()
    expect(saved.deal_status).toBe("analyst_started")
    expect(saved.mid_gross_revenue).toBe("2.00")
  })

  test("cancelling the confirmation doesn't submit", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, PORT_ARANSAS)
    await page.goto(`/underwritings/${id}`)
    await fillUnderwriting(page, {
      ...TYPICAL_INPUTS,
      low: "1",
      mid: "2",
      high: "3",
    })
    await expectAllSaved(page)
    let submits = 0
    page.on("request", (r) => {
      if (r.url().endsWith("/submit")) submits++
    })
    await page.getByRole("link", { name: "Review & submit" }).first().click()
    await page.getByRole("button", { name: "Submit underwriting" }).click()
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText("can't be changed afterwards")
    await dialog.getByRole("button", { name: "Keep reviewing" }).click()
    await expect(dialog).toBeHidden()
    expect(submits).toBe(0)
  })

  test("submits once after confirming, opens the result and updates the dashboard", async ({
    page,
    request,
  }) => {
    const id = await createDraft(request, SEVIERVILLE)
    await page.goto(`/underwritings/${id}`)
    await fillUnderwriting(page, {
      ...TYPICAL_INPUTS,
      low: "70000",
      mid: "80000",
      high: "90000",
    })
    await expectAllSaved(page)
    await page.getByRole("link", { name: "Review & submit" }).first().click()

    let submits = 0
    page.on("request", (r) => {
      if (r.url().endsWith(`/api/underwritings/${id}/submit`)) submits++
    })
    await page.getByRole("button", { name: "Submit underwriting" }).click()
    const confirm = page.getByRole("alertdialog")
    await expect(confirm).toContainText("$80,000")
    await confirm.getByRole("button", { name: "Submit" }).dblclick()

    await expect(page).toHaveURL(/\/submissions\/\d+$/)
    expect(submits).toBe(1)
    await page.goto("/")
    await expect(
      page.getByRole("row").filter({ hasText: "47 Cedar Hollow Rd" }),
    ).toContainText("Submitted")
  })
})
