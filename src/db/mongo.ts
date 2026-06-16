import { MongoClient, type Db } from "mongodb";
import { env } from "../config/env.js";

let client: MongoClient | null = null;

export const getDb = async (): Promise<Db | null> => {
  if (!env.mongoUri) {
    return null;
  }

  if (!client) {
    client = new MongoClient(env.mongoUri);
    await client.connect();
  }

  return client.db(env.mongoDbName);
};

export const closeDb = async () => {
  if (client) {
    await client.close();
    client = null;
  }
};
