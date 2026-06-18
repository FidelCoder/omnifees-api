import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { env } from "./config/env.js";
import referrerRoutes from "./routes/referrers.js";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin === "*" ? true : env.corsOrigin
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "omnifees-api",
    timestamp: new Date().toISOString()
  });
});

app.get("/api", (_req, res) => {
  res.json({
    name: "OmniFees API",
    description: "Referral-fee tracking API for STON.fi/Omniston integrators.",
    endpoints: ["/health", "/api/referrers/:wallet/summary", "/api/referrers/:wallet/sync", "/api/referrers/:wallet/snapshots"]
  });
});

app.use("/api/referrers", referrerRoutes);

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      details: error.issues.map((issue) => issue.message)
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: "Internal server error"
  });
};

app.use(errorHandler);

export default app;
