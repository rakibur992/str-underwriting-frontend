/**
 * Seed properties and their scoring bands, copied from the brief
 * (docs/source/assessment.md, "How scoring works"). zpids come from the
 * seeded API. Both band limits are inclusive; anything outside Medium is Low.
 */
export type Band = readonly [min: number, max: number]

export interface SeedProperty {
  zpid: string
  address: string
  referenceMid: number
  best: Band
  medium: Band
}

export const SEED_PROPERTIES: readonly SeedProperty[] = [
  {
    zpid: "41234567",
    address: "1240 Ski View Dr, Gatlinburg, TN",
    referenceMid: 125_000,
    best: [112_500, 137_500],
    medium: [93_750, 156_250],
  },
  {
    zpid: "52345678",
    address: "88 Lakeshore Ln, Broken Bow, OK",
    referenceMid: 96_000,
    best: [86_400, 105_600],
    medium: [72_000, 120_000],
  },
  {
    zpid: "63456789",
    address: "3402 Palm Isle Ct, Kissimmee, FL",
    referenceMid: 165_000,
    best: [148_500, 181_500],
    medium: [123_750, 206_250],
  },
  {
    zpid: "74567890",
    address: "215 Aspen Ridge Rd, Blue Ridge, GA",
    referenceMid: 128_000,
    best: [115_200, 140_800],
    medium: [96_000, 160_000],
  },
  {
    zpid: "85678901",
    address: "9 Dune Walk, Port Aransas, TX",
    referenceMid: 192_000,
    best: [172_800, 211_200],
    medium: [144_000, 240_000],
  },
  {
    zpid: "96789012",
    address: "47 Cedar Hollow Rd, Sevierville, TN",
    referenceMid: 80_000,
    best: [72_000, 88_000],
    medium: [60_000, 100_000],
  },
]
