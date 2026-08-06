# RM CPC automation

Playwright scripts for **Real Madrid World** Customer Preference Center (`CPC_RM`).

## Setup

```bash
cd RM_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `RM_CPC_URL` / `RM_CPC_ARABIC_URL` when the `qs` token expires.

## Run – ninth 25 values (items 201-225) per field

By default each field uses **offset 200** and **limit 25** - items **201-225** for:

- Country code
- Nationality
- Country of Residence

If fewer than 25 values remain after offset 200, the suite wraps from item **1** until 25 values are collected.

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-rm-cpc-ninth-25.bat
run-rm-cpc-ninth-25.bat --headed
```

Arabic:

```bat
run-rm-cpc-arabic-ninth-25.bat
run-rm-cpc-arabic-ninth-25.bat --headed
```

Or:

```bash
npm run test:ninth25:headed
npm run test:arabic-ninth25:headed
```

Smoke test:

```bat
run-rm-cpc-update-profile.bat --headed
```

Results archive under `RM_CPC_English_Results/` and `RM_CPC_Arabic_Results/`.
