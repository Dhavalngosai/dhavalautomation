# RL CPC automation

Playwright scripts for **River Land Dubai** Customer Preference Center (`RiverLand_CPC`).

## Setup

```bash
cd RL_CPC
npm install
npx playwright install chromium
```

Copy `.env.example` to `.env` and set `RL_CPC_URL` / `RL_CPC_ARABIC_URL` when the `qs` token expires.

## Run – seventh 25 values (items 151-175) per field

By default each field uses **offset 150** and **limit 25** - items **151-175** for:

- Country code
- Nationality
- Country of Residence

Nationality requires Country of Residence = **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).

```bat
run-rl-cpc-seventh-25.bat
run-rl-cpc-seventh-25.bat --headed
```

Arabic:

```bat
run-rl-cpc-arabic-seventh-25.bat
run-rl-cpc-arabic-seventh-25.bat --headed
```

Or:

```bash
npm run test:seventh25:headed
npm run test:arabic-seventh25:headed
```

Smoke test:

```bat
run-rl-cpc-update-profile.bat --headed
```

Results archive under `RL_CPC_English_Results/` and `RL_CPC_Arabic_Results/`.
