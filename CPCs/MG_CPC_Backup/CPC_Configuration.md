# MG CPC Backup – Configuration

Playwright automation for **Motiongate Dubai** Customer Preference Center (production-page copy).

---

## Identity

| Item | Value |
|------|--------|
| Folder | `MG_CPC_Backup` |
| Package | `mg-cpc-automation` `1.0.0` |
| Brand | Motiongate Dubai (production copy) |
| Env prefix | `MG_CPC_` (same as `MG_CPC`) |
| English Cloud Page | `CPC_MG` (CloudPagesURL **2579**) |
| Arabic Cloud Page | `cpc_mg_ar` (CloudPagesURL **3542**) |
| Domain | `cloud.explore.motiongatedubai.com` |

English URL path: `https://cloud.explore.motiongatedubai.com/CPC_MG`  
Arabic URL path: `https://cloud.explore.motiongatedubai.com/cpc_mg_ar`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

This is a **backup / older production-page** suite. The active QA suite is `MG_CPC` (`MGQA_CPC` / `cpc_mg_ar_qa`, first 15).

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `100` | `50` | **101–150** (third 50) |
| Arabic | `100` | `50` | **101–150** |

Env vars: `MG_CPC_FIELD_OFFSET`, `MG_CPC_FIELD_LIMIT`, `MG_CPC_ARABIC_FIELD_OFFSET`, `MG_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `MG_CPC_COUNTRY_CODE_*`, `MG_CPC_NATIONALITY_*`, `MG_CPC_COUNTRY_OF_RESIDENCE_*` (and `MG_CPC_ARABIC_*`).

To run the first 50 instead: set `MG_CPC_FIELD_OFFSET=0`.

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-third-50.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-third-50.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/mg-cpc-update-profile.spec.ts` |

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
cd MG_CPC_Backup
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-mg-cpc-third-50.bat --headed
run-mg-cpc-arabic-third-50.bat --headed
run-mg-cpc-update-profile.bat --headed
```

```bash
npm run test:third50:headed
npm run test:arabic-third50:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
MG_CPC_English_Results/v{version}/{timestamp}/
MG_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `MG_CPC_ENGLISH_RESULTS_DIR` / `MG_CPC_ARABIC_RESULTS_DIR`.
