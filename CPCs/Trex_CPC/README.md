# Trex CPC automation

Playwright scripts for **T.rex Glamping** Customer Preference Center (`TREX_CPC_QA`).

## Setup

```bash
cd TREX_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `TREX_CPC_URL` / `TREX_CPC_ARABIC_URL` when the URL token expires.

## Run – first 50 values (items 1–50) per field

By default each field uses **offset 0** and **limit 50** — items **1–50** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-trex-cpc-first-50.bat
run-trex-cpc-first-50.bat --headed
```

Arabic:

```bat
run-trex-cpc-arabic-first-50.bat
run-trex-cpc-arabic-first-50.bat --headed
```

Or:

```bash
npm run test:first50:headed
npm run test:arabic-first50:headed
```

Smoke test:

```bat
run-trex-cpc-update-profile.bat --headed
```

Results archive under `TREX_CPC_English_Results/` and `TREX_CPC_Arabic_Results/`.
