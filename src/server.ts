import app from "./app.js";
import { env } from "./config/env.js";
import { closeDb } from "./db/mongo.js";

const server = app.listen(env.port, () => {
  console.log(`OmniFees API listening on http://localhost:${env.port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
