# LL CPC automation

Playwright scripts for **LEGOLAND Dubai** Customer Preference Center (`CPC_LL`).

## Setup

```bash
cd LL_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `LL_CPC_URL` / `LL_CPC_ARABIC_URL` when the `qs` token expires.

## Run – first 50 values (items 1–50) per field

By default each field uses **offset 0** and **limit 50** — items **1–50** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-ll-cpc-first-50.bat
run-ll-cpc-first-50.bat --headed
```

Arabic:

```bat
run-ll-cpc-arabic-first-50.bat
run-ll-cpc-arabic-first-50.bat --headed
```

Or:

```bash
npm run test:first50:headed
npm run test:arabic-first50:headed
```

Smoke test:

```bat
run-ll-cpc-update-profile.bat --headed
```

Results archive under `LL_CPC_English_Results/` and `LL_CPC_Arabic_Results/`.
