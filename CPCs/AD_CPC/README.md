# AD CPC automation

Playwright scripts for **Ain Dubai** Customer Preference Center (`CPC_AD`).

## Setup

```bash
cd AD_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `AD_CPC_URL` / `AD_CPC_ARABIC_URL` when the `qs` token expires.

## Run – second 25 values (items 26-50) per field

By default each field uses **offset 25** and **limit 25** - items **26-50** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-ad-cpc-second-25.bat
run-ad-cpc-second-25.bat --headed
```

Arabic:

```bat
run-ad-cpc-arabic-second-25.bat
run-ad-cpc-arabic-second-25.bat --headed
```

Or:

```bash
npm run test:second25:headed
npm run test:arabic-second25:headed
```

Smoke test:

```bat
run-ad-cpc-update-profile.bat --headed
```

Results archive under `AD_CPC_English_Results/` and `AD_CPC_Arabic_Results/`.
