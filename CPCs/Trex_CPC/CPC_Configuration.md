# Trex CPC – Configuration

Playwright automation for **T.rex Glamping** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `Trex_CPC` |
| Package | `trex-cpc-automation` `1.0.0` |
| Brand | T.rex Glamping |
| Env prefix | `TREX_CPC_` |
| English Cloud Page | `TREX_CPC` |
| Arabic Cloud Page | `TREX_CPC_AR` |
| Domain | `cloud.explore.trexglamping.com` |

English URL path: `https://cloud.explore.trexglamping.com/TREX_CPC`  
Arabic URL path: `https://cloud.explore.trexglamping.com/TREX_CPC_AR`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

Live config from `.env.example`, specs, and `package.json`:

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `175` | `25` | **176–200** (eighth 25) |
| Arabic | `175` | `25` | **176–200** |

README still describes a **first 50** run (`offset 0`, `limit 50`) and page name `TREX_CPC_QA`. That is stale. Treat eighth-25 as the live configuration.

Env vars: `TREX_CPC_FIELD_OFFSET`, `TREX_CPC_FIELD_LIMIT`, `TREX_CPC_ARABIC_FIELD_OFFSET`, `TREX_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `TREX_CPC_COUNTRY_CODE_*`, `TREX_CPC_NATIONALITY_*`, `TREX_CPC_COUNTRY_OF_RESIDENCE_*` (and `TREX_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-eighth-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-eighth-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/trex-cpc-update-profile.spec.ts` |

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
cd Trex_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-trex-cpc-eighth-25.bat --headed
run-trex-cpc-arabic-eighth-25.bat --headed
run-trex-cpc-update-profile.bat --headed
```

```bash
npm run test:eighth25:headed
npm run test:arabic-eighth25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
TREX_CPC_English_Results/v{version}/{timestamp}/
TREX_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `TREX_CPC_ENGLISH_RESULTS_DIR` / `TREX_CPC_ARABIC_RESULTS_DIR`.
