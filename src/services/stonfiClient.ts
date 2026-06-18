import { env } from "../config/env.js";
import type { FeeVault, ReferralSummary, SourceReport } from "../models/referralSnapshot.js";

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

const pickString = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
    if (typeof value === "number" || typeof value === "bigint") {
      return String(value);
    }
  }

  return undefined;
};

const pickBoolean = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") {
      return value;
    }
  }

  return undefined;
};

const arrayFromPayload = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object");
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const candidateKeys = ["data", "items", "result", "vaults", "fee_vaults"];

  for (const key of candidateKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is Record<string, unknown> => item !== null && typeof item === "object");
    }
  }

  return [];
};

const parseJson = (text: string) => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
};

const getJson = async (path: string, name: string): Promise<{ data: unknown; source: SourceReport }> => {
  const url = `${normalizeBaseUrl(env.stonfiApiBaseUrl)}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.stonfiRequestTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json"
      },
      signal: controller.signal
    });

    const text = await response.text();
    const data = parseJson(text);

    if (!response.ok) {
      return {
        data: null,
        source: {
          name,
          url,
          status: "error",
          detail: `STON.fi API returned ${response.status}`
        }
      };
    }

    return {
      data,
      source: {
        name,
        url,
        status: "ok"
      }
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";

    return {
      data: null,
      source: {
        name,
        url,
        status: "error",
        detail: timedOut ? `STON.fi API timed out after ${env.stonfiRequestTimeoutMs}ms` : error instanceof Error ? error.message : "Unknown request error"
      }
    };
  } finally {
    clearTimeout(timeout);
  }
};

const hasPositiveBalance = (balance?: string) => {
  if (!balance) {
    return false;
  }

  const normalized = balance.trim();
  if (!normalized || normalized === "0") {
    return false;
  }

  return Number(normalized) > 0 || /^0*[1-9]/.test(normalized);
};

const normalizeVault = (raw: Record<string, unknown>): FeeVault => ({
  protocol: "stonfi-dex-v2",
  vaultAddress: pickString(raw, ["vault_address", "vaultAddress", "address", "addr_str"]),
  tokenAddress: pickString(raw, ["token_address", "tokenAddress", "asset_address", "jetton_address", "token_minter"]),
  tokenSymbol: pickString(raw, ["token_symbol", "tokenSymbol", "symbol", "asset_symbol"]),
  balance: pickString(raw, ["balance", "amount", "claimable_amount", "claimableAmount"]),
  claimable: pickBoolean(raw, ["claimable", "is_claimable"]),
  raw
});

export const buildReferralSummary = async (wallet: string): Promise<ReferralSummary> => {
  const vaultResponse = await getJson(`/v1/wallets/${encodeURIComponent(wallet)}/fee_vaults`, "STON.fi DEX v2 fee vaults");
  const vaults = arrayFromPayload(vaultResponse.data).map(normalizeVault);
  const claimableVaults = vaults.filter((vault) => vault.claimable || hasPositiveBalance(vault.balance)).length;

  return {
    wallet,
    updatedAt: new Date().toISOString(),
    totals: {
      vaultCount: vaults.length,
      claimableVaults
    },
    coverage: [
      {
        protocol: "STON.fi DEX v2",
        status: "available",
        note: "Public REST endpoint lists referral fee vaults by wallet."
      },
      {
        protocol: "STON.fi DEX v1",
        status: "manual",
        note: "Fees are paid directly in swap transactions, so vault discovery does not apply."
      },
      {
        protocol: "DeDust / Tonco / Escrow via Omniston",
        status: "planned",
        note: "STON.fi docs describe on-chain/indexer coverage until broader public REST support exists."
      }
    ],
    vaults,
    sources: [vaultResponse.source],
    notes: [
      "OmniFees does not fabricate fee balances. Empty results can mean no DEX v2 vaults exist for this referrer or the upstream API returned no rows.",
      "External Omniston route coverage is tracked as a roadmap item because those fees require on-chain/indexer handling."
    ]
  };
};
