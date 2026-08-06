# MG CPC automation



Playwright scripts for **Motion Gated Dubai** Customer Preference Center (`CPC_MG`).



## Setup



```bash

cd MG_CPC

npm install

npx playwright install chromium

```



Copy `.env.example` to `.env` and set `MG_CPC_URL` when the default/email `qs` token expires.



## Run – third 50 values (items 101–150) per field



By default each field loop uses **offset 100** and **limit 50** — items **101–150** for all three fields:

- **Country code** — values 101–150 from the dial-code list
- **Nationality** — values 101–150 from the nationality list
- **Country of Residence** — values 101–150 from the country list

**Note:** Nationality is only available when Country of Residence is **United Arab Emirates** (English) or **الإمارات العربية المتحدة** (Arabic). The nationality scripts set UAE automatically before each iteration.

For each value: **select → Save → append a comparison row** (before / after / save status / Success|Mismatch).  

At the end of each field run: `console.table` + HTML/JSON artifacts in the Playwright report (`comparison-table`).

Archived copies are saved on every run under locale-specific version folders:

```
MG_CPC_English_Results/v{version}/{timestamp}/{report-slug}/
  comparison-table.html
  comparison-table.json
  report-metadata.json

MG_CPC_Arabic_Results/v{version}/{timestamp}/{report-slug}/
  comparison-table.html
  comparison-table.json
  report-metadata.json
```

Each locale folder also contains a run-level `run-metadata.json` for that timestamp.



```bat

run-mg-cpc-third-50.bat

run-mg-cpc-third-50.bat --headed

```



Country of Residence only:



```bat

run-mg-cpc-country-of-residence-third-50.bat

run-mg-cpc-country-of-residence-third-50.bat --headed

```



or:



```bash

npm run test:third50

npm run test:third50:headed

npm run test:country-residence-third50:headed

```



### Offset / limit env vars



| Variable | Default | Description |

|----------|---------|-------------|

| `MG_CPC_FIELD_OFFSET` | `100` | Skip first N values |

| `MG_CPC_FIELD_LIMIT` | `50` | How many values to run after offset |

| `MG_CPC_COUNTRY_CODE_OFFSET` | inherits `FIELD_OFFSET` | Per-field override |

| `MG_CPC_NATIONALITY_OFFSET` | inherits `FIELD_OFFSET` | Per-field override |

| `MG_CPC_COUNTRY_OF_RESIDENCE_OFFSET` | inherits `FIELD_OFFSET` | Per-field override |
| `MG_CPC_ENGLISH_RESULTS_DIR` | `MG_CPC_English_Results` | English archive root |
| `MG_CPC_ARABIC_RESULTS_DIR` | `MG_CPC_Arabic_Results` | Arabic archive root |
| `MG_CPC_RESULTS_DIR` | — | Optional legacy override for both locales |
| `MG_CPC_VERSION` | from `package.json` | Version label used in archive paths |
| `MG_CPC_RUN_TIMESTAMP` | auto-generated per run | Override timestamp folder for both locales |
| `MG_CPC_ENGLISH_RUN_TIMESTAMP` | inherits `RUN_TIMESTAMP` | English-only timestamp override |
| `MG_CPC_ARABIC_RUN_TIMESTAMP` | inherits `RUN_TIMESTAMP` | Arabic-only timestamp override |



Run the **first** 50 instead:



```bat

set MG_CPC_FIELD_OFFSET=0

run-mg-cpc-third-50.bat --headed

```



Quick check (3 values starting at item 101):



```bat

set MG_CPC_FIELD_OFFSET=100

set MG_CPC_FIELD_LIMIT=3

run-mg-cpc-third-50.bat --headed

```



## Run – Arabic QA (third 50 per field — items 101–150)



Same flow as English; Arabic option labels and `MG_CPC_ARABIC_URL`.  

Defaults: `MG_CPC_ARABIC_FIELD_OFFSET=100`, `MG_CPC_ARABIC_FIELD_LIMIT=50` — items **101–150** for all three Arabic fields:

- **Country code** — values 101–150
- **Nationality** — values 101–150 (UAE country of residence is set automatically before each iteration)
- **Country of Residence** — values 101–150



```bat

run-mg-cpc-arabic-third-50.bat

run-mg-cpc-arabic-third-50.bat --headed

```



Individual Arabic specs under `tests/arabic/`:



```bash

npm test -- tests/arabic/country-code-and-nationality-third-50.spec.ts

npm test -- tests/arabic/country-of-residence-third-50.spec.ts

npm run test:arabic-third50:headed

```



## Run – single smoke (one Country code + one Nationality)



```bat

run-mg-cpc-update-profile.bat --headed

```



Defaults for smoke: Country code `+971`, Nationality `India`.

