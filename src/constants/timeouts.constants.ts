export const TIMEOUTS = {
  /** Fast assertions / immediate element checks (2s) */
  SHORT: 2_000,
  /** Standard UI interaction & navigation wait (5s) */
  MEDIUM: 5_000,
  /** Slow page loads / third-party integrations (15s) */
  LONG: 15_000,
  /** Network / API response limit (10s) */
  API_RESPONSE: 10_000,
} as const;