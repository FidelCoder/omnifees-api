import { Address } from "@ton/ton";
import { Router } from "express";
import { z } from "zod";
import { getDb } from "../db/mongo.js";
import type { StoredReferralSnapshot } from "../models/referralSnapshot.js";
import { buildReferralSummary } from "../services/stonfiClient.js";

const router = Router();

const walletSchema = z.string().trim().min(1, "Wallet is required");

const parseWallet = (value: string) => {
  const wallet = walletSchema.parse(value);

  try {
    return Address.parse(wallet).toString({ bounceable: true });
  } catch {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        message: "Wallet must be a valid TON address string",
        path: ["wallet"]
      }
    ]);
  }
};

const formatPersistenceError = (error: unknown) =>
  error instanceof Error ? error.message : "Snapshot persistence is unavailable.";

const saveSnapshot = async (snapshot: StoredReferralSnapshot) => {
  try {
    const db = await getDb();
    if (!db) {
      return { persisted: false, persistenceError: "MongoDB is not configured." };
    }

    await db.collection<StoredReferralSnapshot>("referral_snapshots").insertOne(snapshot);
    return { persisted: true };
  } catch (error) {
    return { persisted: false, persistenceError: formatPersistenceError(error) };
  }
};

const loadSnapshots = async (wallet: string) => {
  try {
    const db = await getDb();

    if (!db) {
      return {
        wallet,
        snapshots: [],
        note: "Set MONGODB_URI to enable stored referral snapshots."
      };
    }

    const snapshots = await db
      .collection<StoredReferralSnapshot>("referral_snapshots")
      .find({ wallet })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    return { wallet, snapshots };
  } catch (error) {
    return {
      wallet,
      snapshots: [],
      note: `Snapshot store is unavailable: ${formatPersistenceError(error)}`
    };
  }
};

router.get("/:wallet/summary", async (req, res, next) => {
  try {
    const wallet = parseWallet(req.params.wallet);
    const summary = await buildReferralSummary(wallet);
    res.json({
      ...summary,
      persisted: false
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:wallet/sync", async (req, res, next) => {
  try {
    const wallet = parseWallet(req.params.wallet);
    const summary = await buildReferralSummary(wallet);
    const persistence = await saveSnapshot({
      ...summary,
      createdAt: new Date()
    });

    res.status(201).json({
      ...summary,
      persisted: persistence.persisted,
      persistenceError: persistence.persistenceError
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:wallet/snapshots", async (req, res, next) => {
  try {
    const wallet = parseWallet(req.params.wallet);
    res.json(await loadSnapshots(wallet));
  } catch (error) {
    next(error);
  }
});

export default router;
