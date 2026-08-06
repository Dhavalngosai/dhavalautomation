# IBAA CPC automation

Playwright scripts for **Inside Burj Al Arab** Customer Preference Center (`CPC_IBAA`).

## Setup

```bash
cd IBAA_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `IBAA_CPC_URL` / `IBAA_CPC_ARABIC_URL` when the `qs` token expires.

## Run – fifth 25 values (items 101-125) per field

By default each field uses **offset 100** and **limit 25** - items **101-125** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-ibaa-cpc-fifth-25.bat
run-ibaa-cpc-fifth-25.bat --headed
```

Arabic:

```bat
run-ibaa-cpc-arabic-fifth-25.bat
run-ibaa-cpc-arabic-fifth-25.bat --headed
```

Or:

```bash
npm run test:fifth25:headed
npm run test:arabic-fifth25:headed
```

Smoke test:

```bat
run-ibaa-cpc-update-profile.bat --headed
```

Results archive under `IBAA_CPC_English_Results/` and `IBAA_CPC_Arabic_Results/`.
