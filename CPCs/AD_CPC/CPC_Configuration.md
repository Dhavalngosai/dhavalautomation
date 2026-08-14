# AD CPC – Configuration

Playwright automation for **Ain Dubai** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `AD_CPC` |
| Package | `ad-cpc-automation` `1.0.0` |
| Brand | Ain Dubai |
| Env prefix | `AD_CPC_` |
| English Cloud Page | `CPC_AD` (CloudPagesURL **3102**) |
| Arabic Cloud Page | click redirect (no CloudPagesURL in `.env.example`) |
| Domain | `cloud.explore.aindubai.com` |

English URL path: `https://cloud.explore.aindubai.com/CPC_AD`  
Arabic URL path: `https://click.explore.aindubai.com/` (click redirect)

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `25` | `25` | **26–50** (second 25) |
| Arabic | `25` | `25` | **26–50** |

Env vars: `AD_CPC_FIELD_OFFSET`, `AD_CPC_FIELD_LIMIT`, `AD_CPC_ARABIC_FIELD_OFFSET`, `AD_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `AD_CPC_COUNTRY_CODE_*`, `AD_CPC_NATIONALITY_*`, `AD_CPC_COUNTRY_OF_RESIDENCE_*` (and `AD_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-second-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-second-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/ad-cpc-update-profile.spec.ts` |

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
cd AD_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-ad-cpc-second-25.bat --headed
run-ad-cpc-arabic-second-25.bat --headed
run-ad-cpc-update-profile.bat --headed
```

```bash
npm run test:second25:headed
npm run test:arabic-second25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
AD_CPC_English_Results/v{version}/{timestamp}/
AD_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `AD_CPC_ENGLISH_RESULTS_DIR` / `AD_CPC_ARABIC_RESULTS_DIR`.
