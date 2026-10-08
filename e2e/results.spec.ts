import { expect, test, type Page } from "@playwright/test"

import { SEED_PROPERTIES } from "./fixtures/seed-properties"
import { API_BASE_URL } from "./support/env"
import { blockImages, createDraft, fullPayload } from "./support/underwriting"

/** A scored attempt on Gatlinburg (zpid 41234567): Medium, 20% below. */
const MOCK_SUBMISSION = {
  id: 4242,
  underwriting_id: 77,
  reference_underwriting_id: 1,
  zpid: "41234567",
  rating: "medium",
  accuracy: "70.00",
  submitted_at: "2026-10-07T10:00:00Z",
  breakdown: {
    rating: "medium",
    accuracy: "70.00",
    metric: "mid_gross_revenue",
    label: "Mid revenue forecast",
    candidate: "100000.00",
    reference: "125000.00",
    deviation: "0.2000",
    best_threshold: "0.10",
    medium_threshold: "0.25",
  },
}

const streetOf = (zpid: string) =>
  SEED_PROPERTIES.find((p) => p.zpid === zpid)!.address.split(",")[0]!

type Dashboard = {
  properties: {
    zpid: string
    status: string
    active_underwriting_id: number | null
  }[]
}

/** Serve the real dashboard with every property but `zpid` reshaped by `edit`. */
async function reshapeDashboard(
  page: Page,
  edit: (p: Dashboard["properties"][number]) => void,
) {
  await page.route("**/api/dashboard", async (route) => {
    const res = await route.fetch()
    const body = (await res.json()) as Dashboard
    body.properties.forEach(edit)
    await route.fulfill({ response: res, json: body })
  })
}

/** POSTs the page makes from now on. */
function recordPosts(page: Page) {
  const posts: string[] = []
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r.url())
  })
  return posts
}

test.beforeEach(async ({ page }) => {
  await blockImages(page)
})

test.describe("Evaluation results states", () => {
  test("shows a skeleton while loading, then an error with retry", async ({
    page,
  }) => {
    let fail = true
    await page.route("**/api/submissions/4242", async (route) => {
      await new Promise((r) => setTimeout(r, 400))
      return fail
        ? route.fulfill({
            status: 500,
            json: { detail: "Database unavailable" },
          })
        : route.fulfill({ json: MOCK_SUBMISSION })
    })
    await page.goto("/submissions/4242")
    await expect(
      page.getByRole("status", { name: "Loading your result" }),
    ).toBeVisible()
    const alert = page
      .getByRole("alert")
      .filter({ hasText: "Couldn't load this result" })
    await expect(alert).toContainText("Database unavailable")

    fail = false
    await alert.getByRole("button", { name: "Retry" }).click()
    await expect(
      page.getByRole("region", { name: "Your score" }),
    ).toContainText("You were 20.0% below the analyst's Mid revenue.")
    await expect(
      page.getByRole("region", { name: "Your score" }),
    ).toContainText("Medium")
  })

  test("says when a result doesn't exist", async ({ page }) => {
    await page.goto("/submissions/987654")
    await expect(
      page.getByRole("heading", { level: 1, name: "Result not found" }),
    ).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Back to dashboard" }),
    ).toBeVisible()
  })

  test("explains a missing dashboard and recovers on retry", async ({
    page,
  }) => {
    await page.route("**/api/submissions/4242", (route) =>
      route.fulfill({ json: MOCK_SUBMISSION }),
    )
    let fail = true
    await page.route("**/api/dashboard", (route) =>
      fail
        ? route.fulfill({
            status: 500,
            json: { detail: "Database unavailable" },
          })
        : route.fallback(),
    )
    await page.goto("/submissions/4242")
    await expect(page.getByRole("region", { name: "Your score" })).toBeVisible()

    const next = page.getByRole("region", { name: "Next steps" })
    const alert = next.getByRole("alert")
    await expect(alert).toContainText("Couldn't load your cases")
    // Without the dashboard we can't tell whether a draft is open: don't offer a POST.
    await expect(
      next.getByRole("button", { name: "Try this property again" }),
    ).toBeDisabled()

    fail = false
    await alert.getByRole("button", { name: "Retry" }).click()
    await expect(alert).toBeHidden()
    await expect(
      next
        .getByRole("button", { name: "Try this property again" })
        .or(next.getByRole("link", { name: "Continue your new attempt" })),
    ).toBeEnabled()
  })
})

test.describe("Next steps never duplicate a draft", () => {
  test("an open draft on this property is continued, not re-created", async ({
    page,
    request,
  }) => {
    const zpid = "63456789"
    const first = await createDraft(request, zpid)
    const res = await request.post(
      `${API_BASE_URL}/api/underwritings/${first}/submit`,
      { data: fullPayload(100_000) },
    )
    expect(res.ok()).toBe(true)
    const { submission } = (await res.json()) as { submission: { id: number } }
    // The newest draft becomes the property's active one.
    const draft = await createDraft(request, zpid)

    await page.goto(`/submissions/${submission.id}`)
    const posts = recordPosts(page)
    const next = page.getByRole("region", { name: "Next steps" })
    await next.getByRole("link", { name: "Continue your new attempt" }).click()
    await expect(page).toHaveURL(new RegExp(`/underwritings/${draft}$`))
    await expect(
      page.getByRole("heading", { level: 1, name: streetOf(zpid) }),
    ).toBeVisible()
    expect(posts).toEqual([])
  })

  test("next case continues another property's open draft", async ({
    page,
    request,
  }) => {
    const target = "74567890"
    const draft = await createDraft(request, target)
    // Only the target has a draft; everything else is untouched.
    await reshapeDashboard(page, (p) => {
      if (p.zpid === MOCK_SUBMISSION.zpid) return
      p.status = p.zpid === target ? "in_progress" : "not_started"
      p.active_underwriting_id = p.zpid === target ? draft : null
    })
    await page.route("**/api/submissions/4242", (route) =>
      route.fulfill({ json: MOCK_SUBMISSION }),
    )
    await page.goto("/submissions/4242")
    const posts = recordPosts(page)
    await page
      .getByRole("region", { name: "Next steps" })
      .getByRole("link", { name: `Continue ${streetOf(target)}` })
      .click()
    await expect(page).toHaveURL(new RegExp(`/underwritings/${draft}$`))
    await expect(
      page.getByRole("heading", { level: 1, name: streetOf(target) }),
    ).toBeVisible()
    expect(posts).toEqual([])
  })

  test("next case starts the first unstarted property once", async ({
    page,
  }) => {
    // Next case is the first other property in dashboard order.
    let target: string | undefined
    await reshapeDashboard(page, (p) => {
      if (p.zpid === MOCK_SUBMISSION.zpid) return
      target ??= p.zpid
      p.status = "not_started"
      p.active_underwriting_id = null
    })
    await page.route("**/api/submissions/4242", (route) =>
      route.fulfill({ json: MOCK_SUBMISSION }),
    )
    await page.goto("/submissions/4242")
    await expect(page.getByRole("region", { name: "Your score" })).toBeVisible()
    const button = page
      .getByRole("region", { name: "Next steps" })
      .getByRole("button", { name: /^Next case: / })
    await expect(button).toHaveText(`Next case: ${streetOf(target!)}`)
    await expect(button).toBeEnabled()
    // From here the workspace needs the real dashboard to see the new draft.
    await page.unroute("**/api/dashboard")
    const posts = recordPosts(page)
    await button.dblclick()
    await expect(page).toHaveURL(/\/underwritings\/\d+$/)
    await expect(
      page.getByRole("heading", { level: 1, name: streetOf(target!) }),
    ).toBeVisible()
    expect(posts.filter((u) => u.endsWith("/api/underwritings"))).toHaveLength(
      1,
    )
  })
})
