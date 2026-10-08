// Builds the test oracle for src/lib/calculations: for each seed property it
// creates a draft, saves a set of inputs, and records the API's computed
// outputs. Uses only drafts it creates (never the analyst references).
// Usage: npm run fixtures:capture   (then npm run seed:reset to drop the drafts)
import { mkdir, writeFile } from "node:fs/promises"

const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
const out = new URL(
  "../src/lib/calculations/fixtures/api-calculations.json",
  import.meta.url,
)

// Varied on purpose: zero interest, all-cash, co-hosting fee, no OPEX, odd rates.
const CASES = [
  {
    name: "typical financed cabin",
    purchase: ["650000", "0.20", "0.0699", 30, "0.03"],
    revenue: ["100000", "120000", "140000"],
    coHost: "0",
    appreciation: "0.03",
    taxes: ["0.20", "0.25", "0.60", "0.37"],
    optimization: [
      ["Furniture", "40000"],
      ["Hot tub", "9500"],
    ],
    opex: [
      ["Utilities", "650"],
      ["Insurance", "300"],
      ["Cleaning", "900"],
    ],
  },
  {
    name: "co-hosted with 15% fee",
    purchase: ["420000", "0.25", "0.0725", 30, "0.025"],
    revenue: ["70000", "88000", "101000"],
    coHost: "0.15",
    appreciation: "0.04",
    taxes: ["0.20", "0.25", "0.60", "0.37"],
    optimization: [["Furniture", "28000"]],
    opex: [
      ["Utilities", "420.50"],
      ["Software", "89.99"],
    ],
  },
  {
    name: "zero-interest loan",
    purchase: ["500000", "0.10", "0", 15, "0.02"],
    revenue: ["80000", "95000", "110000"],
    coHost: "0.10",
    appreciation: "0",
    taxes: ["0.15", "0.30", "1", "0.24"],
    optimization: [],
    opex: [["Utilities", "500"]],
  },
  {
    name: "all cash, no operating expenses",
    purchase: ["310000", "1", "0.065", 30, "0.03"],
    revenue: ["40000", "52000", "61000"],
    coHost: "0",
    appreciation: "0.025",
    taxes: ["0.20", "0.25", "0.60", "0.37"],
    optimization: [["Game room", "15000"]],
    opex: [],
  },
  {
    name: "short loan, high rate",
    purchase: ["899000", "0.35", "0.0875", 10, "0.04"],
    revenue: ["150000", "185000", "210000"],
    coHost: "0.20",
    appreciation: "0.05",
    taxes: ["0.25", "0.20", "0.80", "0.32"],
    optimization: [
      ["Pool", "65000"],
      ["Furniture", "55000"],
      ["Decor", "7250.75"],
    ],
    opex: [
      ["Mortgage insurance", "210"],
      ["Utilities", "1100"],
      ["Supplies", "333.33"],
    ],
  },
  {
    name: "low revenue, negative cash flow",
    purchase: ["725000", "0.15", "0.0799", 30, "0.035"],
    revenue: ["30000", "45000", "60000"],
    coHost: "0",
    appreciation: "0.02",
    taxes: ["0.20", "0.25", "0.60", "0.37"],
    optimization: [["Furniture", "20000"]],
    opex: [
      ["Utilities", "800"],
      ["Insurance", "450"],
    ],
  },
]

async function call(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    console.error(`${method} ${path} → ${res.status} ${await res.text()}`)
    process.exit(1)
  }
  return res.json()
}

const dashboard = await call("GET", "/api/dashboard")
const zpids = dashboard.properties.map((p) => p.zpid)

const fixtures = []
for (const [index, c] of CASES.entries()) {
  const draft = await call("POST", "/api/underwritings", {
    zpid: zpids[index % zpids.length],
  })
  const [
    purchase_price,
    down_payment_pct,
    interest_rate,
    mortgage_years,
    closing_costs_pct,
  ] = c.purchase
  const [
    land_assumptions_pct,
    sla_multiplier_pct,
    bonus_amount_pct,
    tax_rate_pct,
  ] = c.taxes
  const payload = {
    purchase_details: {
      purchase_price,
      down_payment_pct,
      interest_rate,
      mortgage_years,
      closing_costs_pct,
    },
    forecasted_revenue: {
      co_hosting_fee_pct: c.coHost,
      annual_re_appreciation_pct: c.appreciation,
      scenarios: {
        low: { forecasted_revenue: c.revenue[0] },
        mid: { forecasted_revenue: c.revenue[1] },
        high: { forecasted_revenue: c.revenue[2] },
      },
    },
    taxes: {
      land_assumptions_pct,
      sla_multiplier_pct,
      bonus_amount_pct,
      tax_rate_pct,
    },
    optimization_items: c.optimization.map(([category, total_price]) => ({
      category,
      total_price,
    })),
    operating_expenses: c.opex.map(([expense_name, monthly_amount]) => ({
      expense_name,
      monthly_amount,
    })),
  }
  const uw = await call("PUT", `/api/underwritings/${draft.id}`, payload)
  fixtures.push({
    name: c.name,
    input: payload,
    output: {
      purchase_details: uw.detail.purchase_details,
      scenarios: uw.detail.forecasted_revenue.scenarios,
      y1_coc_incl_tax_savings: uw.detail.y1_coc_incl_tax_savings,
      taxes: uw.taxes,
      optimization_total: uw.optimization_total,
      operating_expense_total: uw.operating_expense_total,
      total_oop: uw.total_oop,
      prr: uw.prr,
      l_cash_on_cash: uw.l_cash_on_cash,
      m_cash_on_cash: uw.m_cash_on_cash,
      h_cash_on_cash: uw.h_cash_on_cash,
    },
  })
}

await mkdir(new URL(".", out), { recursive: true })
await writeFile(out, `${JSON.stringify(fixtures, null, 2)}\n`)
console.log(`Wrote ${fixtures.length} cases to ${out.pathname}`)
console.log("Drafts were created; run `npm run seed:reset` to remove them.")
