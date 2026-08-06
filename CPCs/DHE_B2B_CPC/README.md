# DHE B2B CPC automation

Playwright scripts for **DHE B2B** Customer Preference Center (`DHE_B2B_CPC`).

## Setup

```bash
cd DHE_B2B_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `DHE_B2B_CPC_URL` / `DHE_B2B_CPC_ARABIC_URL` when the URL token expires.

## Run – from-226 (226-end) values (items 226-end) per field

By default each field uses **offset 225** and **to last value** — items **226-end** for:

- Country code (Business Phone)
- Country of Residence

Nationality is **not** on the DHE B2B form (unlike consumer CPCs).

```bat
run-dhe-b2b-cpc-from-226.bat
run-dhe-b2b-cpc-from-226.bat --headed
```

Arabic:

```bat
run-dhe-b2b-cpc-arabic-from-226.bat
run-dhe-b2b-cpc-arabic-from-226.bat --headed
```

Or:

```bash
npm run test:from226:headed
npm run test:arabic-from226:headed
```

Smoke test:

```bat
run-dhe-b2b-cpc-update-profile.bat --headed
```

Results archive under `DHE_B2B_CPC_English_Results/` and `DHE_B2B_CPC_Arabic_Results/`.
