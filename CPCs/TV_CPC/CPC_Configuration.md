# TV CPC – Configuration

Playwright automation for **The View Palm** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `TV_CPC` |
| Package | `tv-cpc-automation` `1.0.0` |
| Brand | The View Palm |
| Env prefix | `TV_CPC_` |
| English Cloud Page | `CPC_TV` (CloudPagesURL **3623**) |
| Arabic Cloud Page | `CPC_TV_AR` (CloudPagesURL **3883**) |
| Domain | `cloud.explore.theviewpalm.ae` |

English URL path: `https://cloud.explore.theviewpalm.ae/CPC_TV`  
Arabic URL path: `https://cloud.explore.theviewpalm.ae/CPC_TV_AR`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `75` | `25` | **76–100** (fourth 25) |
| Arabic | `75` | `25` | **76–100** |

Env vars: `TV_CPC_FIELD_OFFSET`, `TV_CPC_FIELD_LIMIT`, `TV_CPC_ARABIC_FIELD_OFFSET`, `TV_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `TV_CPC_COUNTRY_CODE_*`, `TV_CPC_NATIONALITY_*`, `TV_CPC_COUNTRY_OF_RESIDENCE_*` (and `TV_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-fourth-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-fourth-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/tv-cpc-update-profile.spec.ts` |

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
cd TV_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-tv-cpc-fourth-25.bat --headed
run-tv-cpc-arabic-fourth-25.bat --headed
run-tv-cpc-update-profile.bat --headed
```

```bash
npm run test:fourth25:headed
npm run test:arabic-fourth25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
TV_CPC_English_Results/v{version}/{timestamp}/
TV_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `TV_CPC_ENGLISH_RESULTS_DIR` / `TV_CPC_ARABIC_RESULTS_DIR`.
