export type SourceStatus = "ok" | "error" | "skipped";

export interface SourceReport {
  name: string;
  url: string;
  status: SourceStatus;
  detail?: string;
}

export interface FeeVault {
  vaultAddress?: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  balance?: string;
  claimable?: boolean;
  protocol: "stonfi-dex-v2";
  raw: Record<string, unknown>;
}

export interface ReferralSummary {
  wallet: string;
  updatedAt: string;
  totals: {
    vaultCount: number;
    claimableVaults: number;
  };
  coverage: Array<{
    protocol: string;
    status: "available" | "manual" | "planned";
    note: string;
  }>;
  vaults: FeeVault[];
  sources: SourceReport[];
  notes: string[];
}

export interface StoredReferralSnapshot extends ReferralSummary {
  createdAt: Date;
}
