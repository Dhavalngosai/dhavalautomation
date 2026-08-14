# RM CPC – Configuration

Playwright automation for **Real Madrid World** Customer Preference Center.

---

## Identity

| Item | Value |
|------|--------|
| Folder | `RM_CPC` |
| Package | `rm-cpc-automation` `1.0.0` |
| Brand | Real Madrid World |
| Env prefix | `RM_CPC_` |
| English Cloud Page | `CPC_RM` (CloudPagesURL **2876**) |
| Arabic Cloud Page | `RMW_Arabic_CPC` (CloudPagesURL **3445**) |
| Domain | `cloud.explore.realmadridworld.com` |

English URL path: `https://cloud.explore.realmadridworld.com/CPC_RM`  
Arabic URL path: `https://cloud.explore.realmadridworld.com/RMW_Arabic_CPC`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

| Locale | Offset | Limit | Items |
|--------|--------|-------|-------|
| English | `200` | `25` | **201–225** (ninth 25) |
| Arabic | `200` | `25` | **201–225** |

If fewer than 25 values remain after offset 200, remaining values **wrap from item 1**.

Env vars: `RM_CPC_FIELD_OFFSET`, `RM_CPC_FIELD_LIMIT`, `RM_CPC_ARABIC_FIELD_OFFSET`, `RM_CPC_ARABIC_FIELD_LIMIT`.  
Per-field overrides: `RM_CPC_COUNTRY_CODE_*`, `RM_CPC_NATIONALITY_*`, `RM_CPC_COUNTRY_OF_RESIDENCE_*` (and `RM_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality-ninth-25.spec.ts` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence-ninth-25.spec.ts` |
| Arabic (same fields) | same | `tests/arabic/*.spec.ts` |
| Smoke | `#country-code`, `#nationality` | `tests/rm-cpc-update-profile.spec.ts` |

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
cd RM_CPC
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-rm-cpc-ninth-25.bat --headed
run-rm-cpc-arabic-ninth-25.bat --headed
run-rm-cpc-update-profile.bat --headed
```

```bash
npm run test:ninth25:headed
npm run test:arabic-ninth25:headed
npm run report
```

Smoke defaults: Country code `+971`, Nationality `India`.

---

## Results

```
RM_CPC_English_Results/v{version}/{timestamp}/
RM_CPC_Arabic_Results/v{version}/{timestamp}/
```

Override roots with `RM_CPC_ENGLISH_RESULTS_DIR` / `RM_CPC_ARABIC_RESULTS_DIR`.
