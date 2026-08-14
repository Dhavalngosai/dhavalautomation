# Roxy CPC – Configuration

Playwright automation for **Roxy Cinemas** Customer Preference Center (Live).

---

## Identity

| Item | Value |
|------|--------|
| Folder | `roxy-cpc-automation` |
| Package | `roxy-cpc-automation` `1.0.0` |
| Brand | Roxy Cinemas |
| Env prefix | `ROXY_CPC_` |
| English Cloud Page | `CPC_Roxy` |
| Arabic Cloud Page | `CPC_Roxy_AR` (CloudPagesURL **3481**) |
| Domain | `cloud.explore.theroxycinemas.com` |

English URL path: `https://cloud.explore.theroxycinemas.com/CPC_Roxy`  
Arabic URL path: `https://cloud.explore.theroxycinemas.com/CPC_Roxy_AR`  

Paste the full SFMC email URL (including `qs=` token) into `.env`. Refresh when the token expires.

---

## Batch

**All values** by default (offset `0`, no limit). Optional subset:

```env
ROXY_CPC_FIELD_LIMIT=50
ROXY_CPC_FIELD_OFFSET=100
ROXY_CPC_ARABIC_FIELD_LIMIT=50
ROXY_CPC_ARABIC_FIELD_OFFSET=100
```

Per-field overrides: `ROXY_CPC_COUNTRY_CODE_*`, `ROXY_CPC_NATIONALITY_*`, `ROXY_CPC_COUNTRY_OF_RESIDENCE_*` (and `ROXY_CPC_ARABIC_*`).

---

## Fields

| Field | Selector | Spec |
|-------|----------|------|
| Country code + Nationality (paired) | `#country-code`, `#nationality` | `tests/country-code-and-nationality.spec.js` |
| Country of Residence | `#profileCountry` | `tests/country-of-residence.spec.js` |
| Country code only | `#country-code` | `tests/country-code.spec.js` |
| Arabic (same fields) | same | `tests/arabic/*.spec.js` |

Nationality is enabled only when Country of Residence is **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).  
Save: `#profile-submit` (Arabic may fall back to **حفظ**). Profile tab: `#my-profile-tab`.

---

## Playwright

| Setting | Value |
|---------|--------|
| Config | `playwright.config.js` |
| `testDir` | `./tests` |
| Timeout | `120000` ms |
| Workers | `1` |
| Headless | **always headed** (`headless: false`) |
| `ignoreHTTPSErrors` | not set (unlike other suites) |
| Screenshot / video / trace | `only-on-failure` / `on` / `on-first-retry` |
| Reporters | HTML + `terminal-output-reporter.js` + list |

Extra script: `npm run automation` → `node automation.js`.

---

## How to run

```bash
cd roxy-cpc-automation
npm install
npx playwright install chromium
copy .env.example .env
```

```bat
run-roxy-all-fields.bat --headed
run-roxy-arabic-all-fields.bat --headed
```

```bash
npm run test:all-fields:headed
npm run test:arabic-all-fields:headed
npm run report
```

---

## Results

```
Roxy_CPC_English_Results/v{version}/{timestamp}/{report-slug}/
Roxy_CPC_Arabic_Results/v{version}/{timestamp}/{report-slug}/
```

Override roots with `ROXY_CPC_ENGLISH_RESULTS_DIR` / `ROXY_CPC_ARABIC_RESULTS_DIR`.
