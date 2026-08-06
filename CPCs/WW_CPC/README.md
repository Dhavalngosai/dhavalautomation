# WW CPC automation

Playwright scripts for **Wild Wadi** Customer Preference Center (`CPC_WW`).

## Setup

```bash
cd WW_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `WW_CPC_URL` / `WW_CPC_ARABIC_URL` when the `qs` token expires.

## Run – third 25 values (items 51-75) per field

By default each field uses **offset 50** and **limit 25** - items **51-75** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-ww-cpc-third-25.bat
run-ww-cpc-third-25.bat --headed
```

Arabic:

```bat
run-ww-cpc-arabic-third-25.bat
run-ww-cpc-arabic-third-25.bat --headed
```

Or:

```bash
npm run test:third25:headed
npm run test:arabic-third25:headed
```

Smoke test:

```bat
run-ww-cpc-update-profile.bat --headed
```

Results archive under `WW_CPC_English_Results/` and `WW_CPC_Arabic_Results/`.
