import { expect, test } from "@playwright/test"

import { API_BASE_URL } from "./support/env"

test("app shell renders", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
})

// global-setup resets the seed; other specs submit, so don't depend on run order here.
test("API is reachable and serves the six seed properties", async ({
  request,
}) => {
  const res = await request.get(`${API_BASE_URL}/api/dashboard`)
  expect(res.ok()).toBe(true)

  const body = await res.json()
  expect(body.properties).toHaveLength(6)
  expect(body.summary.total_properties).toBe(6)
})
