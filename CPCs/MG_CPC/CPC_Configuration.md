# MG CPC – Configuration

Playwright automation for **Motiongate Dubai** Customer Preference Center (QA).

---

## Identity

| Item | Value |
|------|--------|
| Folder | `MG_CPC` |
| Package | `mg-cpc-automation` `1.0.0` |
| Brand | Motiongate Dubai (QA) |
| Env prefix | `MG_CPC_` |
| English Cloud Page | `MGQA_CPC` (CloudPagesURL **2556**) |
| Arabic Cloud Page | `cpc_mg_ar_qa` (CloudPagesURL **3381**) |
| Domain | `cloud.explore.motiongatedubai.com` |

English URL path: `https://cloud.explore.motiongatedubai.com/MGQA_CPC`  
Arabic URL path: `https://cloud.explore.motiongatedubai.com/cpc_mg_ar_qa`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

This is the **QA** suite. Production pages live in `MG_CPC_Backup` (`CPC_MG` / `cpc_mg_ar`, third 50).

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `0` | `15` | **1–15** |
| Arabic | `0` | `15` | **1–15** |

Env vars: `MG_CPC_FIELD_OFFSET`, `MG_CPC_FIELD_LIMIT`, `MG_CPC_ARABIC_FIELD_OFFSET`, `MG_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `MG_CPC_COUNTRY_CODE_*`, `MG_CPC_NATIONALITY_*`, `MG_CPC_COUNTRY_OF_RESIDENCE_*` (and `MG_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-first-15.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-first-15.spec.ts` |
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
cd MG_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-mg-cpc-first-15.bat --headed
run-mg-cpc-arabic-first-15.bat --headed
run-mg-cpc-update-profile.bat --headed
```

```bash
npm run test:first15:headed
npm run test:arabic-first15:headed
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
