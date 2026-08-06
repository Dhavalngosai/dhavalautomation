# OB CPC automation

Playwright scripts for **Oasis Bay Dubai** Customer Preference Center (`OasisBay_CPC`).

## Setup

```bash
cd OB_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `OB_CPC_URL` / `OB_CPC_ARABIC_URL` when the `qs` token expires.

## Run – sixth 25 values (items 126-150) per field

By default each field uses **offset 125** and **limit 25** - items **126-150** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-ob-cpc-sixth-25.bat
run-ob-cpc-sixth-25.bat --headed
```

Arabic:

```bat
run-ob-cpc-arabic-sixth-25.bat
run-ob-cpc-arabic-sixth-25.bat --headed
```

Or:

```bash
npm run test:sixth25:headed
npm run test:arabic-sixth25:headed
```

Smoke test:

```bat
run-ob-cpc-update-profile.bat --headed
```

Results archive under `OB_CPC_English_Results/` and `OB_CPC_Arabic_Results/`.
