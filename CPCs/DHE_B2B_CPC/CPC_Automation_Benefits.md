# DHE B2B CPC Automation – Benefits Over Manual Testing

Asset-specific reference for presenting the value of **DHE B2B** Customer Preference Center ($(System.Collections.Hashtable.Pages)) automation versus manual validation.

> Shared framework: see also `CPC_Automation_Benefits.md` at the CPCs root for the common story across all brands.

---

## Asset Overview

| Item | Detail |
|------|--------|
| **Brand / Asset** | DHE B2B |
| **Code** | DHE B2B |
| **Folder** | `DHE_B2B_CPC` |
| **CPC pages** | DHE_B2B_CPC |
| **Locales** | English and Arabic (where applicable) |
| **Focus fields** | Country Code, Nationality, Country of Residence |

---

## The Challenge Today

Customer Preference Center (CPC) validation for **DHE B2B** means checking many dropdown values — **Country Code**, **Nationality**, and **Country of Residence** — in **English and Arabic**, then confirming each save works correctly.

Done manually, that means:

1. Opening the DHE B2B CPC page  
2. Selecting a value  
3. Clicking Save  
4. Checking the result  
5. Recording pass/fail  
6. Repeating for every value  

For even **15 values × 3 fields × 2 languages**, that is dozens of careful, repetitive steps. Doing this only for DHE B2B already consumes significant QA time; repeating it across other brands multiplies cost and risk.

---

## What These Scripts Do

The **DHE B2B CPC** automation:

1. Opens the DHE B2B CPC page with a valid subscriber link  
2. Selects each value in a controlled batch (for example, first 15 / first 25 / first 50, depending on the suite)  
3. Saves and verifies the value stuck correctly  
4. Records **before / after / save status / Success or Mismatch**  
5. Produces an HTML + JSON comparison report (where enabled: **page URL** and **time taken**)

Country Code and Nationality are typically updated **together in one save**, matching real user behavior more closely than testing them in isolation.

---

## Benefits Over Manual Effort

| Area | Manual | DHE B2B CPC Automated Scripts |
|------|--------|----------------------------------|
| **Speed** | Hours of repetitive clicking | Minutes for the same batch |
| **Consistency** | Varies by tester fatigue/attention | Same steps every run |
| **Accuracy** | Easy to miss a mismatch | Exact before/after comparison |
| **Evidence** | Spreadsheets / screenshots (ad hoc) | Timestamped HTML/JSON audit trail |
| **Coverage** | Often reduced to “sample a few” | Full planned batch every time |
| **Languages** | Separate manual pass for Arabic | Same flow for English + Arabic |
| **Repeatability** | Hard to re-run identically | One command / bat file |
| **Traceability** | Weak for audits | URL + runtime + result archive |

---

## Business Value for Leadership (DHE B2B)

### 1. Faster release confidence

QA can validate DHE B2B CPC changes before email/campaign go-live without burning a full day on dropdown checks.

### 2. Lower risk of customer-facing defects

Wrong country code, nationality, or residence values hurt data quality and preference accuracy for DHE B2B subscribers. Automation catches mismatches systematically.

### 3. Stronger audit and stakeholder proof

Reports show what was tested for DHE B2B, on which URL, how long it took, and which values passed/failed — useful for audits, UAT sign-off, and status updates.

### 4. Part of a scalable multi-brand framework

DHE B2B uses the same CPC automation pattern as other assets (Motiongate, DPR, LEGOLAND, and others). Once built, reuse reduces cost per brand instead of rebuilding manual checklists each time.

### 5. Better use of skilled people

Testers spend less time on repetitive clicking on DHE B2B CPC and more on exploratory testing, edge cases, and campaign validation.

### 6. Reliable regression

After SFMC / Cloud Page / profile logic changes affecting DHE B2B, the same suite can be re-run quickly to confirm nothing broke.

---

## Simple ROI Framing (Example)

If one manual pass for DHE B2B (15+ values × multiple fields × EN + AR) takes roughly **2–4 hours**, and automation does the same in a fraction of that with a reusable report:

- **Time saved per cycle** → faster UAT / sanity cycles for DHE B2B  
- **Fewer escaped defects** → fewer production fixes and customer impact  
- **Reusable asset** → cost amortizes across every future DHE B2B run  

Even if automation is used only for sanity/regression before each major DHE B2B CPC or email change, the cumulative saving and risk reduction are significant.

---

## One-Liner for Executives

> The DHE B2B CPC scripts replace hours of repetitive, error-prone dropdown checks with a consistent, auditable, bilingual automation suite that verifies Save behavior at scale and produces evidence-ready reports — so we ship DHE B2B preference-center changes faster, with higher confidence and lower operational risk.

---

## FAQ Talking Points

**Why not keep doing DHE B2B CPC checks manually?**

- Manual checks do not scale when value lists grow or when DHE B2B must be validated alongside other brands.  
- Fatigue causes missed mismatches; automation compares values exactly.  
- Manual evidence is hard to standardize; automation archives URL, duration, and row-level results every run.  
- Arabic + English doubles manual effort; automation runs both with the same structure.

---

## Typical Report Outputs (DHE B2B CPC)

Each automated run can produce:

- Comparison table (HTML + JSON)  
- Pass / fail / mismatch per value  
- Page URL used for the run  
- Total time taken  
- Archived results under locale-specific folders (English / Arabic)

---

## How to Run (Quick Pointer)

From the `DHE_B2B_CPC` folder:

1. `npm install`  
2. `npx playwright install chromium` (first time)  
3. Copy `.env.example` to `.env` and refresh CPC URLs when `qs` tokens expire  
4. Use the asset’s `run-*-cpc-*.bat` scripts or `npm run` commands documented in `README.md`

---

*DHE B2B CPC automation benefits document — aligned with the common CPCs framework.*
