# TV CPC automation

Playwright scripts for **The View Palm** Customer Preference Center (`CPC_TV`).

## Setup

```bash
cd TV_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `TV_CPC_URL` / `TV_CPC_ARABIC_URL` when the `qs` token expires.

## Run – fourth 25 values (items 76-100) per field

By default each field uses **offset 75** and **limit 25** - items **76-100** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-tv-cpc-fourth-25.bat
run-tv-cpc-fourth-25.bat --headed
```

Arabic:

```bat
run-tv-cpc-arabic-fourth-25.bat
run-tv-cpc-arabic-fourth-25.bat --headed
```

Or:

```bash
npm run test:fourth25:headed
npm run test:arabic-fourth25:headed
```

Smoke test:

```bat
run-tv-cpc-update-profile.bat --headed
```

Results archive under `TV_CPC_English_Results/` and `TV_CPC_Arabic_Results/`.
