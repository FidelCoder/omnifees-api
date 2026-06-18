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

const saveSnapshot = async (snapshot: StoredReferralSnapshot) => {
  const db = await getDb();
  if (!db) {
    return false;
  }

  await db.collection<StoredReferralSnapshot>("referral_snapshots").insertOne(snapshot);
  return true;
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
    const persisted = await saveSnapshot({
      ...summary,
      createdAt: new Date()
    });

    res.status(201).json({
      ...summary,
      persisted
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:wallet/snapshots", async (req, res, next) => {
  try {
    const wallet = parseWallet(req.params.wallet);
    const db = await getDb();

    if (!db) {
      res.json({
        wallet,
        snapshots: [],
        note: "Set MONGODB_URI to enable stored referral snapshots."
      });
      return;
    }

    const snapshots = await db
      .collection<StoredReferralSnapshot>("referral_snapshots")
      .find({ wallet })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    res.json({
      wallet,
      snapshots
    });
  } catch (error) {
    next(error);
  }
});

export default router;
