# IBAA CPC – Configuration

Playwright automation for **Inside Burj Al Arab** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `IBAA_CPC` |
| Package | `ibaa-cpc-automation` `1.0.0` |
| Brand | Inside Burj Al Arab |
| Env prefix | `IBAA_CPC_` |
| English Cloud Page | `CPC_IBAA` (CloudPagesURL **3925**) |
| Arabic Cloud Page | `CPC_IBAA_AR` (CloudPagesURL **3911**) |
| Domain | `cloud.explore.insideburjalarab.com` |

English URL path: `https://cloud.explore.insideburjalarab.com/CPC_IBAA`  
Arabic URL path: `https://cloud.explore.insideburjalarab.com/CPC_IBAA_AR`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `100` | `25` | **101–125** (fifth 25) |
| Arabic | `100` | `25` | **101–125** |

Env vars: `IBAA_CPC_FIELD_OFFSET`, `IBAA_CPC_FIELD_LIMIT`, `IBAA_CPC_ARABIC_FIELD_OFFSET`, `IBAA_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `IBAA_CPC_COUNTRY_CODE_*`, `IBAA_CPC_NATIONALITY_*`, `IBAA_CPC_COUNTRY_OF_RESIDENCE_*` (and `IBAA_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-fifth-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-fifth-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/ibaa-cpc-update-profile.spec.ts` |

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
cd IBAA_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-ibaa-cpc-fifth-25.bat --headed
run-ibaa-cpc-arabic-fifth-25.bat --headed
run-ibaa-cpc-update-profile.bat --headed
```

```bash
npm run test:fifth25:headed
npm run test:arabic-fifth25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
IBAA_CPC_English_Results/v{version}/{timestamp}/
IBAA_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `IBAA_CPC_ENGLISH_RESULTS_DIR` / `IBAA_CPC_ARABIC_RESULTS_DIR`.
