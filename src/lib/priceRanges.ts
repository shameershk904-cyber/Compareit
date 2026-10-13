/** Discrete PKR price bands for catalog filters (aligned with site budget tiers). */
export const PRICE_RANGES = [
  { id: "over-200k", label: "Prices > 200,000", min: 200_001, max: 600_000 },
  { id: "120-200", label: "120,001 - 200,000", min: 120_001, max: 200_000 },
  { id: "80-120", label: "80,001 - 120,000", min: 80_001, max: 120_000 },
  { id: "60-80", label: "60,001 - 80,000", min: 60_001, max: 80_000 },
  { id: "40-60", label: "40,001 - 60,000", min: 40_001, max: 60_000 },
  { id: "25-40", label: "25,001 - 40,000", min: 25_001, max: 40_000 },
  { id: "15-25", label: "15,001 - 25,000", min: 15_001, max: 25_000 },
  { id: "under-15", label: "Prices ≤ 15,000", min: 0, max: 15_000 },
] as const;

export type PriceRangeId = (typeof PRICE_RANGES)[number]["id"];

export const DEFAULT_MAX_PRICE = 600_000;
