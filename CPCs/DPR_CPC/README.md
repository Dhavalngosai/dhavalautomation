# DPR CPC automation



Playwright scripts for **Dubai Parks and Resorts** Customer Preference Center (`CPC_DPR` / `cpc_dpr_ar`).



## Setup



```bash

cd DPR_CPC

npm install

npx playwright install chromium

```



Copy `.env.example` to `.env` and set `DPR_CPC_URL` when the default/email `qs` token expires.



## Run – second 50 values (items 51–100) per field



By default each field loop uses **offset 50** and **limit 50** (the second batch of values).  

Country Code and Nationality are updated **together** in one spec (`tests/country-code-and-nationality-second-50.spec.ts`): each iteration sets both fields, clicks Save once, and records one comparison row. Country of Residence has its own spec.

For each value: **select → Save → append a comparison row** (before / after / save status / Success|Mismatch).  

At the end of each field run: `console.table` + HTML/JSON artifacts in the Playwright report (`comparison-table`).

Archived copies are saved on every run under locale-specific version folders:

```
DPR_CPC_English_Results/v{version}/{timestamp}/{report-slug}/
  comparison-table.html
  comparison-table.json
  report-metadata.json

DPR_CPC_Arabic_Results/v{version}/{timestamp}/{report-slug}/
  comparison-table.html
  comparison-table.json
  report-metadata.json
```

Each locale folder also contains a run-level `run-metadata.json` for that timestamp.



```bat

run-dpr-cpc-second-50.bat

run-dpr-cpc-second-50.bat --headed

```



Country of Residence only:



```bat

run-dpr-cpc-country-of-residence-second-50.bat

run-dpr-cpc-country-of-residence-second-50.bat --headed

```



or:



```bash

npm run test:second50

npm run test:second50:headed

npm run test:country-residence-second50:headed

```



### Offset / limit env vars



| Variable | Default | Description |

|----------|---------|-------------|

| `DPR_CPC_FIELD_OFFSET` | `50` | Skip first N values |

| `DPR_CPC_FIELD_LIMIT` | `50` | How many values to run after offset |

| `DPR_CPC_COUNTRY_CODE_OFFSET` | inherits `FIELD_OFFSET` | Per-field override |

| `DPR_CPC_NATIONALITY_OFFSET` | inherits `FIELD_OFFSET` | Per-field override |

| `DPR_CPC_COUNTRY_OF_RESIDENCE_OFFSET` | inherits `FIELD_OFFSET` | Per-field override |
| `DPR_CPC_ENGLISH_RESULTS_DIR` | `DPR_CPC_English_Results` | English archive root |
| `DPR_CPC_ARABIC_RESULTS_DIR` | `DPR_CPC_Arabic_Results` | Arabic archive root |
| `DPR_CPC_RESULTS_DIR` | — | Optional legacy override for both locales |
| `DPR_CPC_VERSION` | from `package.json` | Version label used in archive paths |
| `DPR_CPC_RUN_TIMESTAMP` | auto-generated per run | Override timestamp folder for both locales |
| `DPR_CPC_ENGLISH_RUN_TIMESTAMP` | inherits `RUN_TIMESTAMP` | English-only timestamp override |
| `DPR_CPC_ARABIC_RUN_TIMESTAMP` | inherits `RUN_TIMESTAMP` | Arabic-only timestamp override |



Run the **first** 50 instead:



```bat

set DPR_CPC_FIELD_OFFSET=0

run-dpr-cpc-second-50.bat --headed

```



Quick check (3 values starting at item 51):



```bat

set DPR_CPC_FIELD_OFFSET=50

set DPR_CPC_FIELD_LIMIT=3

run-dpr-cpc-second-50.bat --headed

```



## Run – Arabic QA (second 50 per field)



Same flow as English; Arabic option labels and `DPR_CPC_ARABIC_URL`.  

Defaults: `DPR_CPC_ARABIC_FIELD_OFFSET=50`, `DPR_CPC_ARABIC_FIELD_LIMIT=50`.



**Note:** Nationality is only available when Country of Residence is **الإمارات العربية المتحدة** (UAE). The Arabic nationality script sets UAE automatically before each iteration.



```bat

run-dpr-cpc-arabic-second-50.bat

run-dpr-cpc-arabic-second-50.bat --headed

```



Individual Arabic specs under `tests/arabic/`:



```bash

npm test -- tests/arabic/country-code-and-nationality-second-50.spec.ts

npm test -- tests/arabic/country-of-residence-second-50.spec.ts

npm run test:arabic-second50:headed

```



## Run – single smoke (one Country code + one Nationality)



```bat

run-dpr-cpc-update-profile.bat --headed

```



Defaults for smoke: Country code `+971`, Nationality `India`.


