# CPC Automation – Configuration Inventory

Observed from each project’s `.env.example`, `package.json`, `playwright.config.js`, `lib/`, tests, and README.  
`qs=` / `sfid=` subscriber tokens expire and are **not** copied here. Refresh them in `.env` from the latest SFMC email.

Per-suite detail lives in each folder’s `CPC_Configuration.md`:

| Suite | File |
|-------|------|
| Motiongate QA | [MG_CPC/CPC_Configuration.md](MG_CPC/CPC_Configuration.md) |
| Dubai Parks and Resorts | [DPR_CPC/CPC_Configuration.md](DPR_CPC/CPC_Configuration.md) |
| LEGOLAND | [LL_CPC/CPC_Configuration.md](LL_CPC/CPC_Configuration.md) |
| Global Village | [GV_CPC/CPC_Configuration.md](GV_CPC/CPC_Configuration.md) |
| Ain Dubai | [AD_CPC/CPC_Configuration.md](AD_CPC/CPC_Configuration.md) |
| Wild Wadi | [WW_CPC/CPC_Configuration.md](WW_CPC/CPC_Configuration.md) |
| The View Palm | [TV_CPC/CPC_Configuration.md](TV_CPC/CPC_Configuration.md) |
| Inside Burj Al Arab | [IBAA_CPC/CPC_Configuration.md](IBAA_CPC/CPC_Configuration.md) |
| Oasis Bay | [OB_CPC/CPC_Configuration.md](OB_CPC/CPC_Configuration.md) |
| River Land | [RL_CPC/CPC_Configuration.md](RL_CPC/CPC_Configuration.md) |
| T.rex Glamping | [Trex_CPC/CPC_Configuration.md](Trex_CPC/CPC_Configuration.md) |
| Real Madrid World | [RM_CPC/CPC_Configuration.md](RM_CPC/CPC_Configuration.md) |
| DHE B2B | [DHE_B2B_CPC/CPC_Configuration.md](DHE_B2B_CPC/CPC_Configuration.md) |
| The Green Planet | [TGP_CPC/CPC_Configuration.md](TGP_CPC/CPC_Configuration.md) |
| Roxy Cinemas | [roxy-cpc-automation/CPC_Configuration.md](roxy-cpc-automation/CPC_Configuration.md) |
| Motiongate backup | [MG_CPC_Backup/CPC_Configuration.md](MG_CPC_Backup/CPC_Configuration.md) |

---

## Shared Playwright settings

Most suites use the same `playwright.config.js`:

| Setting | Value |
|---------|--------|
| `testDir` | `./tests` |
| Test timeout | `120000` ms |
| Retries | `0` |
| Workers | `1` |
| Headless | `true` when `CI` is set; headed locally |
| Viewport | `1280×720` in CI; `null` (maximized) locally |
| Launch args (local) | `--start-maximized` |
| HTTPS errors | ignored (`ignoreHTTPSErrors: true`) |
| Screenshot | `only-on-failure` |
| Video | `on` |
| Trace | `on-first-retry` |
| Action timeout | `20000` ms |
| Navigation timeout | `60000` ms |
| Reporters | HTML (`playwright-report`, never auto-open) + list |

**Exceptions**

- **TGP_CPC** — always headed; extra reporters: `terminal-output-reporter.js` and `versioned-results-reporter.js`.
- **roxy-cpc-automation** — always headed; extra `terminal-output-reporter.js`; no `ignoreHTTPSErrors`.

---

## Shared field behavior

Typical My Profile flow:

1. Open Cloud Page URL → click `#my-profile-tab`.
2. Loop values: select → Save (`#profile-submit`) → comparison row (before / after / save status / Success or Mismatch).
3. Country Code + Nationality are saved **together** in one spec. Country of Residence is a separate spec.
4. Nationality is enabled only when Country of Residence is **United Arab Emirates** / **الإمارات العربية المتحدة** (set automatically).
5. Reports: `console.table` + `comparison-table.html` / `.json`, archived under `{PREFIX}_English_Results/v{version}/{timestamp}/` and `{PREFIX}_Arabic_Results/...`.

| Field | Selector |
|-------|----------|
| Country code | `#country-code` (datalist `#codedatalistOptions`) |
| Nationality | `#nationality` |
| Country of Residence | `#profileCountry` (Select2) |
| Save | `#profile-submit` (Arabic may fall back to **حفظ**) |
| Profile tab | `#my-profile-tab` |

**DHE B2B** has no Nationality field. Country code is treated as Business Phone.

---

## Master comparison

| Folder | Brand | Cloud pages (EN / AR) | Domain | Default batch | Offset / Limit | Nationality | Env prefix |
|--------|-------|------------------------|--------|---------------|----------------|-------------|------------|
| `MG_CPC` | Motiongate Dubai (QA) | `MGQA_CPC` / `cpc_mg_ar_qa` | cloud.explore.motiongatedubai.com | First 15 (1–15) | `0` / `15` | Yes | `MG_CPC_` |
| `DPR_CPC` | Dubai Parks and Resorts | `CPC_DPR` / `cpc_dpr_ar` | cloud.explore.dubaiparksandresorts.com | Second 50 (51–100) | `50` / `50` | Yes | `DPR_CPC_` |
| `LL_CPC` | LEGOLAND Dubai | `CPC_LL` / `CPC_LL_AR` | cloud.explore.legoland.ae | First 50 (1–50) | `0` / `50` | Yes | `LL_CPC_` |
| `GV_CPC` | Global Village | `EN_CPC` / `AR_CPC` | cloud.explore.globalvillage.ae | First 25 (1–25) | `0` / `25` | Yes | `GV_CPC_` |
| `AD_CPC` | Ain Dubai | `CPC_AD` / click redirect | cloud.explore.aindubai.com | Second 25 (26–50) | `25` / `25` | Yes | `AD_CPC_` |
| `WW_CPC` | Wild Wadi | `CPC_WW` / `CPC_WW_AR` | cloud.explore.wildwadi.com | Third 25 (51–75) | `50` / `25` | Yes | `WW_CPC_` |
| `TV_CPC` | The View Palm | `CPC_TV` / `CPC_TV_AR` | cloud.explore.theviewpalm.ae | Fourth 25 (76–100) | `75` / `25` | Yes | `TV_CPC_` |
| `IBAA_CPC` | Inside Burj Al Arab | `CPC_IBAA` / `CPC_IBAA_AR` | cloud.explore.insideburjalarab.com | Fifth 25 (101–125) | `100` / `25` | Yes | `IBAA_CPC_` |
| `OB_CPC` | Oasis Bay Dubai (QA) | `OasisBay_CPC_QA` / `OasisBay_AR_CPC_QA` | cloud.explore.oasisbaydubai.com | See [OB note](#ob_cpc--oasis-bay-dubai) | env `250` / `50` | Yes | `OB_CPC_` |
| `RL_CPC` | River Land Dubai | `RiverLand_CPC` / `Riverland_AR_CPC` | cloud.explore.riverlanddubai.com | Seventh 25 (151–175) | `150` / `25` | Yes | `RL_CPC_` |
| `Trex_CPC` | T.rex Glamping | `TREX_CPC` / `TREX_CPC_AR` | cloud.explore.trexglamping.com | Eighth 25 (176–200) | `175` / `25` | Yes | `TREX_CPC_` |
| `RM_CPC` | Real Madrid World | `CPC_RM` / `RMW_Arabic_CPC` | cloud.explore.realmadridworld.com | Ninth 25 (201–225) | `200` / `25` | Yes | `RM_CPC_` |
| `DHE_B2B_CPC` | DHE B2B | `DHE_B2B_CPC` / `DHE_B2B_AR_Prod` | cloud.sales.dhentertainment.ae | From 226 to end | `225` / `999999` | **No** | `DHE_B2B_CPC_` |
| `TGP_CPC` | The Green Planet Dubai | `CPC_TGP` / `CPC_TGP_AR` | cloud.explore.thegreenplanetdubai.com | **All values** | `0` / none | Yes | `TGP_CPC_` |
| `roxy-cpc-automation` | Roxy Cinemas | `CPC_Roxy` / `CPC_Roxy_AR` | cloud.explore.theroxycinemas.com | **All values** | `0` / none | Yes | `ROXY_CPC_` |
| `MG_CPC_Backup` | Motiongate (prod copy) | `CPC_MG` / `cpc_mg_ar` | cloud.explore.motiongatedubai.com | Third 50 (101–150) | `100` / `50` | Yes | `MG_CPC_` |

Batch ranges are designed so brands cover different slices of the same dropdown lists (except TGP / Roxy, which run the full list).

---

## Env var pattern

Each suite reads `{PREFIX}_URL` and `{PREFIX}_ARABIC_URL`. Batch size:

| Variable | Role |
|----------|------|
| `{PREFIX}_FIELD_LIMIT` | How many values after offset |
| `{PREFIX}_FIELD_OFFSET` | Skip first N values (0-based) |
| `{PREFIX}_COUNTRY_CODE_LIMIT` / `_OFFSET` | Per-field override |
| `{PREFIX}_NATIONALITY_LIMIT` / `_OFFSET` | Per-field override (not used on DHE B2B) |
| `{PREFIX}_COUNTRY_OF_RESIDENCE_LIMIT` / `_OFFSET` | Per-field override |
| `{PREFIX}_ARABIC_FIELD_LIMIT` / `_OFFSET` | Arabic batch (same pattern + per-field keys) |
| `{PREFIX}_ENGLISH_RESULTS_DIR` / `_ARABIC_RESULTS_DIR` | Archive roots |
| `{PREFIX}_VERSION` | Archive version folder (defaults to `package.json` `1.0.0`) |
| `{PREFIX}_RUN_TIMESTAMP` | Optional timestamp folder override |
| `{PREFIX}_COUNTRY_CODE` / `_NATIONALITY` | Smoke-test single values (default `+971` / `India`) |
| `{PREFIX}_LOCATOR_TIMEOUT_MS` | Optional locator wait (some suites) |

Copy `.env.example` → `.env` and refresh URLs when the token expires.

---

## Per-CPC details

### MG_CPC — Motiongate Dubai (QA)

| Item | Value |
|------|--------|
| Package | `mg-cpc-automation` |
| English page | `https://cloud.explore.motiongatedubai.com/MGQA_CPC` (CloudPagesURL **2556**) |
| Arabic page | `https://cloud.explore.motiongatedubai.com/cpc_mg_ar_qa` (CloudPagesURL **3381**) |
| Batch | items **1–15** (`FIELD_OFFSET=0`, `FIELD_LIMIT=15`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:first15`, `test:arabic-first15`, `test:country-residence-first15` |
| Bat | `run-mg-cpc-first-15.bat`, `run-mg-cpc-arabic-first-15.bat`, `run-mg-cpc-update-profile.bat` |
| Specs | `tests/country-code-and-nationality-first-15.spec.ts`, `tests/country-of-residence-first-15.spec.ts` (+ `tests/arabic/`) |
| Archives | `MG_CPC_English_Results/`, `MG_CPC_Arabic_Results/` |

Active QA suite. Distinct from `MG_CPC_Backup` (production Cloud Pages + third-50 batch).

---

### DPR_CPC — Dubai Parks and Resorts

| Item | Value |
|------|--------|
| Package | `dpr-cpc-automation` |
| English page | `https://cloud.explore.dubaiparksandresorts.com/CPC_DPR` (CloudPagesURL **2475**) |
| Arabic page | `https://cloud.explore.dubaiparksandresorts.com/cpc_dpr_ar` (CloudPagesURL **3258**) |
| Batch | items **51–100** (`FIELD_OFFSET=50`, `FIELD_LIMIT=50`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:second50`, `test:arabic-second50` |
| Bat | `run-dpr-cpc-second-50.bat`, `run-dpr-cpc-arabic-second-50.bat` |
| Archives | `DPR_CPC_English_Results/`, `DPR_CPC_Arabic_Results/` |

---

### LL_CPC — LEGOLAND Dubai

| Item | Value |
|------|--------|
| Package | `ll-cpc-automation` |
| English page | `https://cloud.explore.legoland.ae/CPC_LL` (CloudPagesURL **2857**) |
| Arabic page | `https://cloud.explore.legoland.ae/CPC_LL_AR` (CloudPagesURL **3515**) |
| Batch | items **1–50** (`FIELD_OFFSET=0`, `FIELD_LIMIT=50`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:first50`, `test:arabic-first50` |
| Bat | `run-ll-cpc-first-50.bat`, `run-ll-cpc-arabic-first-50.bat` |
| Archives | `LL_CPC_English_Results/`, `LL_CPC_Arabic_Results/` |

---

### GV_CPC — Global Village

| Item | Value |
|------|--------|
| Package | `gv-cpc-automation` |
| English page | `https://cloud.explore.globalvillage.ae/EN_CPC` (CloudPagesURL **3423**) |
| Arabic page | `https://cloud.explore.globalvillage.ae/AR_CPC` (CloudPagesURL **3459**) |
| Batch | items **1–25** (`FIELD_OFFSET=0`, `FIELD_LIMIT=25`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:first25`, `test:arabic-first25` |
| Bat | `run-gv-cpc-first-25.bat`, `run-gv-cpc-arabic-first-25.bat` |
| Archives | `GV_CPC_English_Results/`, `GV_CPC_Arabic_Results/` |

---

### AD_CPC — Ain Dubai

| Item | Value |
|------|--------|
| Package | `ad-cpc-automation` |
| English page | `https://cloud.explore.aindubai.com/CPC_AD` (CloudPagesURL **3102**) |
| Arabic page | `https://click.explore.aindubai.com/` (click redirect; no CloudPagesURL in example) |
| Batch | items **26–50** (`FIELD_OFFSET=25`, `FIELD_LIMIT=25`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:second25`, `test:arabic-second25` |
| Bat | `run-ad-cpc-second-25.bat`, `run-ad-cpc-arabic-second-25.bat` |
| Archives | `AD_CPC_English_Results/`, `AD_CPC_Arabic_Results/` |

---

### WW_CPC — Wild Wadi

| Item | Value |
|------|--------|
| Package | `ww-cpc-automation` |
| English page | `https://cloud.explore.wildwadi.com/CPC_WW` (CloudPagesURL **3048**) |
| Arabic page | `https://cloud.explore.wildwadi.com/CPC_WW_AR` (CloudPagesURL **3799**) |
| Batch | items **51–75** (`FIELD_OFFSET=50`, `FIELD_LIMIT=25`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:third25`, `test:arabic-third25` |
| Bat | `run-ww-cpc-third-25.bat`, `run-ww-cpc-arabic-third-25.bat` |
| Archives | `WW_CPC_English_Results/`, `WW_CPC_Arabic_Results/` |

---

### TV_CPC — The View Palm

| Item | Value |
|------|--------|
| Package | `tv-cpc-automation` |
| English page | `https://cloud.explore.theviewpalm.ae/CPC_TV` (CloudPagesURL **3623**) |
| Arabic page | `https://cloud.explore.theviewpalm.ae/CPC_TV_AR` (CloudPagesURL **3883**) |
| Batch | items **76–100** (`FIELD_OFFSET=75`, `FIELD_LIMIT=25`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:fourth25`, `test:arabic-fourth25` |
| Bat | `run-tv-cpc-fourth-25.bat`, `run-tv-cpc-arabic-fourth-25.bat` |
| Archives | `TV_CPC_English_Results/`, `TV_CPC_Arabic_Results/` |

---

### IBAA_CPC — Inside Burj Al Arab

| Item | Value |
|------|--------|
| Package | `ibaa-cpc-automation` |
| English page | `https://cloud.explore.insideburjalarab.com/CPC_IBAA` (CloudPagesURL **3925**) |
| Arabic page | `https://cloud.explore.insideburjalarab.com/CPC_IBAA_AR` (CloudPagesURL **3911**) |
| Batch | items **101–125** (`FIELD_OFFSET=100`, `FIELD_LIMIT=25`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:fifth25`, `test:arabic-fifth25` |
| Bat | `run-ibaa-cpc-fifth-25.bat`, `run-ibaa-cpc-arabic-fifth-25.bat` |
| Archives | `IBAA_CPC_English_Results/`, `IBAA_CPC_Arabic_Results/` |

---

### OB_CPC — Oasis Bay Dubai

| Item | Value |
|------|--------|
| Package | `ob-cpc-automation` |
| English page | `https://cloud.explore.oasisbaydubai.com/OasisBay_CPC_QA` (uses `sfid=` token, not `qs=`) |
| Arabic page | `https://cloud.explore.oasisbaydubai.com/OasisBay_AR_CPC_QA` (CloudPagesURL **5236**) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:sixth25`, `test:arabic-sixth25` |
| Specs | `*-sixth-25.spec.ts` |
| Archives | `OB_CPC_English_Results/`, `OB_CPC_Arabic_Results/` |

**Config mismatch to be aware of**

| Source | Offset | Limit | Items |
|--------|--------|-------|-------|
| `.env.example` | `250` | `50` | **251–300** (wraps from item 1 if the list is shorter) |
| `lib/fieldRange.js` + README | `125` | `25` | **126–150** |

If `.env` is copied from `.env.example`, the env values win (251–300). Without those env vars, code defaults to 126–150.

---

### RL_CPC — River Land Dubai

| Item | Value |
|------|--------|
| Package | `rl-cpc-automation` |
| English page | `https://cloud.explore.riverlanddubai.com/RiverLand_CPC` (CloudPagesURL **5070**) |
| Arabic page | `https://cloud.explore.riverlanddubai.com/Riverland_AR_CPC` (CloudPagesURL **5189**) |
| Batch | items **151–175** (`FIELD_OFFSET=150`, `FIELD_LIMIT=25`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:seventh25`, `test:arabic-seventh25` |
| Bat | `run-rl-cpc-seventh-25.bat`, `run-rl-cpc-arabic-seventh-25.bat` |
| Archives | `RL_CPC_English_Results/`, `RL_CPC_Arabic_Results/` |

---

### Trex_CPC — T.rex Glamping

| Item | Value |
|------|--------|
| Package | `trex-cpc-automation` |
| English page | `https://cloud.explore.trexglamping.com/TREX_CPC` |
| Arabic page | `https://cloud.explore.trexglamping.com/TREX_CPC_AR` |
| Batch (env + tests + npm) | items **176–200** (`FIELD_OFFSET=175`, `FIELD_LIMIT=25`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:eighth25`, `test:arabic-eighth25` |
| Specs | `*-eighth-25.spec.ts` |
| Archives | `TREX_CPC_English_Results/`, `TREX_CPC_Arabic_Results/` |

README still describes a **first 50** run (`offset 0`, `limit 50`) and `TREX_CPC_QA`. That does not match `.env.example`, specs, or `package.json`. Treat eighth-25 as the live configuration.

---

### RM_CPC — Real Madrid World

| Item | Value |
|------|--------|
| Package | `rm-cpc-automation` |
| English page | `https://cloud.explore.realmadridworld.com/CPC_RM` (CloudPagesURL **2876**) |
| Arabic page | `https://cloud.explore.realmadridworld.com/RMW_Arabic_CPC` (CloudPagesURL **3445**) |
| Batch | items **201–225** (`FIELD_OFFSET=200`, `FIELD_LIMIT=25`) |
| Wrap | If fewer than 25 values remain after offset 200, remaining values wrap from item 1 |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:ninth25`, `test:arabic-ninth25` |
| Bat | `run-rm-cpc-ninth-25.bat`, `run-rm-cpc-arabic-ninth-25.bat` |
| Archives | `RM_CPC_English_Results/`, `RM_CPC_Arabic_Results/` |

---

### DHE_B2B_CPC — DHE B2B

| Item | Value |
|------|--------|
| Package | `dhe-b2b-cpc-automation` |
| English page | `https://cloud.sales.dhentertainment.ae/DHE_B2B_CPC` |
| Arabic page | `https://cloud.sales.dhentertainment.ae/DHE_B2B_AR_Prod` |
| Batch | items **226–end** (`FIELD_OFFSET=225`, `FIELD_LIMIT=999999`) |
| Fields | Country code (Business Phone), Country of Residence — **no Nationality** |
| Main npm scripts | `test:from226`, `test:arabic-from226` |
| Bat | `run-dhe-b2b-cpc-from-226.bat`, `run-dhe-b2b-cpc-arabic-from-226.bat` |
| Archives | `DHE_B2B_CPC_English_Results/`, `DHE_B2B_CPC_Arabic_Results/` |

`openMyProfile` waits for `#country-code` and `#profileCountry` only (not `#nationality`). Specs are still named `country-code-and-nationality-from-226` for consistency with other suites.

---

### TGP_CPC — The Green Planet Dubai

| Item | Value |
|------|--------|
| Package | `tgp-cpc-automation` |
| English page | `https://cloud.explore.thegreenplanetdubai.com/CPC_TGP` (CloudPagesURL **2754**) |
| Arabic page | `https://cloud.explore.thegreenplanetdubai.com/CPC_TGP_AR` (CloudPagesURL **3339**) |
| Batch | **all values** (offset `0`, no limit unless set) |
| Fields | Country code, Nationality, Country of Residence |
| Playwright | Always headed; versioned results reporter archives full `playwright-report` + `test-results` |
| Main npm scripts | `test:all-fields`, `test:arabic-all-fields`, `test:smoke` |
| Specs | `tests/country-code-and-nationality.spec.js`, `tests/country-of-residence.spec.js` (+ `tests/arabic/`) |
| Archives | `TGP_CPC_English_Results/`, `TGP_CPC_Arabic_Results/` |

---

### roxy-cpc-automation — Roxy Cinemas

| Item | Value |
|------|--------|
| Package | `roxy-cpc-automation` |
| English page | `https://cloud.explore.theroxycinemas.com/CPC_Roxy` |
| Arabic page | `https://cloud.explore.theroxycinemas.com/CPC_Roxy_AR` (CloudPagesURL **3481**) |
| Batch | **all values** (offset `0`, no limit unless set) |
| Fields | Country code, Nationality, Country of Residence |
| Playwright | Always headed; terminal-output reporter; no `ignoreHTTPSErrors` |
| Extra script | `npm run automation` → `node automation.js` |
| Main npm scripts | `test:all-fields`, `test:arabic-all-fields` |
| Specs | `tests/country-code-and-nationality.spec.js`, `tests/country-of-residence.spec.js`, `tests/country-code.spec.js` |
| Archives | `Roxy_CPC_English_Results/`, `Roxy_CPC_Arabic_Results/` |

---

### MG_CPC_Backup — Motiongate (production copy)

| Item | Value |
|------|--------|
| Package | `mg-cpc-automation` (same name as `MG_CPC`) |
| English page | `https://cloud.explore.motiongatedubai.com/CPC_MG` (CloudPagesURL **2579**) |
| Arabic page | `https://cloud.explore.motiongatedubai.com/cpc_mg_ar` (CloudPagesURL **3542**) |
| Batch | items **101–150** (`FIELD_OFFSET=100`, `FIELD_LIMIT=50`) |
| Fields | Country code, Nationality, Country of Residence |
| Main npm scripts | `test:third50`, `test:arabic-third50` |
| Bat | `run-mg-cpc-third-50.bat`, `run-mg-cpc-arabic-third-50.bat` |
| Archives | `MG_CPC_English_Results/`, `MG_CPC_Arabic_Results/` |

Backup / older production-page suite. Do not confuse with `MG_CPC` (QA pages + first 15).

---

## Common npm / bat commands

Every suite also has:

```bash
npm test                 # all specs
npm run test:headed
npm run test:ui
npm run report           # playwright show-report playwright-report
```

Smoke (single Country code + Nationality, default `+971` / `India`):

```bat
run-*-cpc-update-profile.bat --headed
```

DHE B2B smoke sets Country code only.

---

## Setup (any suite)

```bash
cd <CPC_FOLDER>
npm install
npx playwright install chromium
copy .env.example .env
```

Then paste a fresh preference-center URL into `{PREFIX}_URL` / `{PREFIX}_ARABIC_URL` when the token expires.

---

## Notes observed while inventorying

1. **Token expiry** — every Cloud Page URL includes a subscriber token. Tests fail with an expired/invalid page until `.env` is refreshed.
2. **Slice coverage** — consumer parks split the same dropdown lists across brands (15 / 25 / 50-value windows). TGP and Roxy verify the full list.
3. **OB_CPC** — `.env.example` (251–300 / limit 50) disagrees with code default and README (126–150 / limit 25).
4. **Trex_CPC** — README still says first 50 / `TREX_CPC_QA`; live config is eighth 25 on `TREX_CPC` / `TREX_CPC_AR`.
5. **DHE B2B** — only B2B / sales domain (`cloud.sales.dhentertainment.ae`); no Nationality.
6. **AD Arabic** — example URL is a `click.explore.aindubai.com` redirect, not a direct `cloud.explore` Cloud Page path.
7. **OB English** — uses `sfid=` instead of `qs=`.
8. **MG_CPC vs MG_CPC_Backup** — QA first-15 vs production third-50; same env prefix `MG_CPC_`.

---

*Generated from the CPC folders under this workspace. Update this file when batch ranges, Cloud Page names, or field coverage change.*
