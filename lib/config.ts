// Centralized config — reads env vars lazily at runtime.
// Throws only when a value is actually accessed, not at build time.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Lazy config — only reads env vars when properties are accessed
export const config = {
  get close() {
    return {
      apiKey: requireEnv('CLOSE_API_KEY'),
      leadStatusId: requireEnv('CLOSE_LEAD_STATUS_ID'),
      cf: {
        propertyAddress: requireEnv('CLOSE_CF_PROPERTY_ADDRESS'),
        askingRent: requireEnv('CLOSE_CF_ASKING_RENT'),           // repurposed: monthly rent
        daysOnMarket: requireEnv('CLOSE_CF_DAYS_ON_MARKET'),       // repurposed: switch timeline
        urgencyScore: requireEnv('CLOSE_CF_URGENCY_SCORE'),
        auditSummary: requireEnv('CLOSE_CF_AUDIT_SUMMARY'),       // repurposed: sweep summary
        leadSource: requireEnv('CLOSE_CF_LEAD_SOURCE'),
      },
    };
  },
  get discord() {
    return {
      webhookUrl: requireEnv('DISCORD_WEBHOOK_URL'),
    };
  },
  get site() {
    return {
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://sweep.hearthproperty.com',
    };
  },
} as const;

// --- Business Constants ---
export const HEARTH_MANAGEMENT_FEE_RATE = 0.08;  // 8% of rental proceeds
export const RESERVE_RATE = 0.05;                  // 5% of monthly rent
export const RESERVE_FLOOR = 250;                  // $250 minimum reserve
export const UTILITY_OWNER_RATE = 0.05;            // 5% of rent if owner pays
export const UTILITY_SPLIT_RATE = 0.025;           // 2.5% of rent if split
