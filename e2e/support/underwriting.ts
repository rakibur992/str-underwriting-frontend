import { expect, type APIRequestContext, type Page } from "@playwright/test"

import { API_BASE_URL } from "./env"

/** Creates a fresh draft through the API (setup only; the UI path is covered elsewhere). */
export async function createDraft(request: APIRequestContext, zpid: string) {
  const res = await request.post(`${API_BASE_URL}/api/underwritings`, {
    data: { zpid },
  })
  expect(res.status()).toBe(201)
  return ((await res.json()) as { id: number }).id
}

/** Seed photos come from picsum.photos; keep runs off the network. */
export async function blockImages(page: Page) {
  await page.route("https://picsum.photos/**", (route) => route.abort())
}

export interface UnderwritingInputs {
  downPayment: string
  interestRate: string
  loanTerm: string
  closingCosts: string
  expenses: [name: string, monthly: string][]
  items: [category: string, amount: string][]
  low: string
  mid: string
  high: string
}

export const TYPICAL_INPUTS: Omit<UnderwritingInputs, "low" | "mid" | "high"> =
  {
    downPayment: "20",
    interestRate: "6.99",
    loanTerm: "30",
    closingCosts: "3",
    expenses: [
      ["Utilities", "650"],
      ["Insurance", "300"],
    ],
    items: [["Furniture & design", "40000"]],
  }

/** Fills Financials and Analysis through the UI, like a trainee would. */
export async function fillUnderwriting(page: Page, inputs: UnderwritingInputs) {
  await page.getByRole("tab", { name: /Financials/ }).click()
  await page.getByLabel("Down payment").fill(inputs.downPayment)
  await page.getByLabel("Interest rate").fill(inputs.interestRate)
  await page.getByLabel("Loan term").fill(inputs.loanTerm)
  await page.getByLabel("Closing costs").fill(inputs.closingCosts)

  for (const [i, [category, amount]] of inputs.items.entries()) {
    await page.getByRole("button", { name: "Add item" }).click()
    await page.getByLabel(`Item ${i + 1} category`).fill(category)
    await page.getByLabel(`Item ${i + 1} amount`).fill(amount)
  }
  for (const [i, [name, monthly]] of inputs.expenses.entries()) {
    await page.getByRole("button", { name: "Add expense" }).click()
    await page.getByLabel(`Expense ${i + 1} name`).fill(name)
    await page.getByLabel(`Expense ${i + 1} monthly amount`).fill(monthly)
  }

  await page.getByRole("tab", { name: /Analysis/ }).click()
  await page.getByLabel(/^Low revenue/).fill(inputs.low)
  await page.getByLabel(/^Mid revenue/).fill(inputs.mid)
  await page.getByLabel(/^High revenue/).fill(inputs.high)
  await page.getByLabel(/^High revenue/).blur()
}

/** Waits until autosave has stored everything and the API's numbers are shown. */
export async function expectAllSaved(page: Page) {
  // `visible`: a hidden, preserved review route has its own save status.
  await expect(
    page.getByText(/^Saved at /).filter({ visible: true }),
  ).toBeVisible({ timeout: 10_000 })
  await expect(
    page.getByRole("complementary").getByText("Saved results"),
  ).toBeVisible()
}

/** "$130,000" as the app formats whole dollars. */
export const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`

/** From the workspace: open review, submit, confirm, land on the result. */
export async function submitFromWorkspace(page: Page) {
  await page.getByRole("link", { name: "Review & submit" }).first().click()
  await page.getByRole("button", { name: "Submit underwriting" }).click()
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Submit" })
    .click()
  await expect(page).toHaveURL(/\/submissions\/\d+$/)
}

/** Every section the API needs to grade, with the given Mid (API-level setup for bulk cases). */
export function fullPayload(mid: number) {
  return {
    purchase_details: {
      purchase_price: "500000",
      down_payment_pct: "0.2",
      interest_rate: "0.07",
      mortgage_years: 30,
      closing_costs_pct: "0.03",
    },
    forecasted_revenue: {
      scenarios: {
        low: { forecasted_revenue: String(Math.round(mid * 0.85)) },
        mid: { forecasted_revenue: String(mid) },
        high: { forecasted_revenue: String(Math.round(mid * 1.15)) },
      },
    },
    taxes: {
      land_assumptions_pct: "0.2",
      sla_multiplier_pct: "0.25",
      bonus_amount_pct: "0.6",
      tax_rate_pct: "0.37",
    },
  }
}
