# OmniFees API

API and indexer foundation for tracking STON.fi/Omniston referral fee vaults.

## What It Does

- Reads STON.fi DEX v2 referral fee vaults for a referrer wallet.
- Stores referral snapshots in MongoDB when `MONGODB_URI` is configured.
- Exposes a small HTTP API for the OmniFees dashboard.
- Tracks unsupported external Omniston route coverage as an explicit roadmap item instead of returning fake balances.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The API runs on `http://localhost:4000`.

## Environment

```bash
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/omnifees
MONGODB_DB=omnifees
CORS_ORIGIN=http://localhost:3000
STONFI_API_BASE_URL=https://api.ston.fi
```

## Endpoints

- `GET /health`
- `GET /api/referrers/:wallet/summary`
- `POST /api/referrers/:wallet/sync`
- `GET /api/referrers/:wallet/snapshots`

## Notes

STON.fi DEX v2 referral fee vaults are exposed through public REST. DeDust, Tonco, and Escrow referral-fee routes require on-chain/indexer coverage until broader public REST support is available.
