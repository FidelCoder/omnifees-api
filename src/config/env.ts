import "dotenv/config";

const optional = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const env = {
  port: Number(optional(process.env.PORT, "4000")),
  nodeEnv: optional(process.env.NODE_ENV, "development"),
  mongoUri: process.env.MONGODB_URI?.trim() || "",
  mongoDbName: optional(process.env.MONGODB_DB, "omnifees"),
  corsOrigin: optional(process.env.CORS_ORIGIN, "http://localhost:3000"),
  stonfiApiBaseUrl: optional(process.env.STONFI_API_BASE_URL, "https://api.ston.fi")
};
