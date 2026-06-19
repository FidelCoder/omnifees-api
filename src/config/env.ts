import "dotenv/config";

const optional = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

const optionalNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(optional(value, String(fallback)));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  port: optionalNumber(process.env.PORT, 4000),
  nodeEnv: optional(process.env.NODE_ENV, "development"),
  mongoUri: process.env.MONGODB_URI?.trim() || "",
  mongoDbName: optional(process.env.MONGODB_DB, "omnifees"),
  mongoServerSelectionTimeoutMs: optionalNumber(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS, 5000),
  corsOrigin: optional(process.env.CORS_ORIGIN, "*"),
  stonfiApiBaseUrl: optional(process.env.STONFI_API_BASE_URL, "https://api.ston.fi"),
  stonfiRequestTimeoutMs: optionalNumber(process.env.STONFI_REQUEST_TIMEOUT_MS, 10000)
};
