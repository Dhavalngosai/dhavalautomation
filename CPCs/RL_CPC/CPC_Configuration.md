# RL CPC – Configuration

Playwright automation for **River Land Dubai** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `RL_CPC` |
| Package | `rl-cpc-automation` `1.0.0` |
| Brand | River Land Dubai |
| Env prefix | `RL_CPC_` |
| English Cloud Page | `RiverLand_CPC` (CloudPagesURL **5070**) |
| Arabic Cloud Page | `Riverland_AR_CPC` (CloudPagesURL **5189**) |
| Domain | `cloud.explore.riverlanddubai.com` |

English URL path: `https://cloud.explore.riverlanddubai.com/RiverLand_CPC`  
Arabic URL path: `https://cloud.explore.riverlanddubai.com/Riverland_AR_CPC`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `150` | `25` | **151–175** (seventh 25) |
| Arabic | `150` | `25` | **151–175** |

Env vars: `RL_CPC_FIELD_OFFSET`, `RL_CPC_FIELD_LIMIT`, `RL_CPC_ARABIC_FIELD_OFFSET`, `RL_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `RL_CPC_COUNTRY_CODE_*`, `RL_CPC_NATIONALITY_*`, `RL_CPC_COUNTRY_OF_RESIDENCE_*` (and `RL_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-seventh-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-seventh-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/rl-cpc-update-profile.spec.ts` |

Nationality is enabled only when Country of Residence is **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).  
Save: `#profile-submit`. Profile tab: `#my-profile-tab`.

---

## Playwright

| Setting | Value |
|---------|--------|
| Config | `playwright.config.js` |
| `testDir` | `./tests` |
| Timeout | `120000` ms |
| Workers | `1` |
| Headless | `true` when `CI` is set |
| Screenshot / video / trace | `only-on-failure` / `on` / `on-first-retry` |
| Reporters | HTML (`playwright-report`) + list |

---

## How to run

```bash
cd RL_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-rl-cpc-seventh-25.bat --headed
run-rl-cpc-arabic-seventh-25.bat --headed
run-rl-cpc-update-profile.bat --headed
```

```bash
npm run test:seventh25:headed
npm run test:arabic-seventh25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
RL_CPC_English_Results/v{version}/{timestamp}/
RL_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `RL_CPC_ENGLISH_RESULTS_DIR` / `RL_CPC_ARABIC_RESULTS_DIR`.
