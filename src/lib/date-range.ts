export type AnalyticsRange = "today" | "7d" | "30d" | "quarterly" | "all";

const VALID_RANGES = new Set<AnalyticsRange>(["today", "7d", "30d", "quarterly", "all"]);

/**
 * Resolves dashboard/analytics range query params into a concrete start date.
 * Supports: today | 7d | 30d | quarterly (90d) | all
 */
export function resolveAnalyticsRange(
  rangeParam: string | null | undefined,
  fallback: AnalyticsRange = "7d"
): { range: AnalyticsRange; startDate: Date } {
  const raw = (rangeParam || fallback).toLowerCase();
  const range: AnalyticsRange = VALID_RANGES.has(raw as AnalyticsRange)
    ? (raw as AnalyticsRange)
    : fallback;

  const now = new Date();
  const startDate = new Date(now);

  switch (range) {
    case "today":
      startDate.setHours(0, 0, 0, 0);
      break;
    case "30d":
      startDate.setDate(now.getDate() - 30);
      break;
    case "quarterly":
      startDate.setDate(now.getDate() - 90);
      break;
    case "all":
      return { range, startDate: new Date(0) };
    case "7d":
    default:
      startDate.setDate(now.getDate() - 7);
      break;
  }

  return { range, startDate };
}
