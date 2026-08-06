# GV CPC automation

Playwright scripts for **Global Village** Customer Preference Center (`EN_CPC`).

## Setup

```bash
cd GV_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `GV_CPC_URL` / `GV_CPC_ARABIC_URL` when the `qs` token expires.

## Run – first 25 values (items 1-25) per field

By default each field uses **offset 0** and **limit 25** - items **1-25** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-gv-cpc-first-25.bat
run-gv-cpc-first-25.bat --headed
```

Arabic:

```bat
run-gv-cpc-arabic-first-25.bat
run-gv-cpc-arabic-first-25.bat --headed
```

Or:

```bash
npm run test:first25:headed
npm run test:arabic-first25:headed
```

Smoke test:

```bat
run-gv-cpc-update-profile.bat --headed
```

Results archive under `GV_CPC_English_Results/` and `GV_CPC_Arabic_Results/`.
