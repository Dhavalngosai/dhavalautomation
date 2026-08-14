# CPC Automation – Benefits Over Manual Testing

A common reference for presenting the value of Customer Preference Center (CPC) automation scripts versus manual validation efforts.

---

## The Challenge Today

Customer Preference Center (CPC) validation means checking many dropdown values — **Country Code**, **Nationality**, and **Country of Residence** — in **English and Arabic**, then confirming each save works correctly.

Done manually, that means:

1. Opening the page  
2. Selecting a value  
3. Clicking Save  
4. Checking the result  
5. Recording pass/fail  
6. Repeating for every value  

For even **15 values × 3 fields × 2 languages**, that is dozens of careful, repetitive steps. Across brands (MG, DPR, LL, and others), the effort multiplies quickly.

---

## What These Scripts Do

The automation:

1. Opens the CPC page with a valid subscriber link  
2. Selects each value in a controlled batch (for example, first 15)  
3. Saves and verifies the value stuck correctly  
4. Records **before / after / save status / Success or Mismatch**  
5. Produces an HTML + JSON comparison report with **page URL** and **time taken**

Country Code and Nationality are updated **together in one save**, matching real user behavior more closely than testing them in isolation.

---

## Benefits Over Manual Effort

| Area | Manual | Automated Scripts |
|------|--------|-------------------|
| **Speed** | Hours of repetitive clicking | Minutes for the same batch |
| **Consistency** | Varies by tester fatigue/attention | Same steps every run |
| **Accuracy** | Easy to miss a mismatch | Exact before/after comparison |
| **Evidence** | Spreadsheets / screenshots (ad hoc) | Timestamped HTML/JSON audit trail |
| **Coverage** | Often reduced to “sample a few” | Full planned batch every time |
| **Languages** | Separate manual pass for Arabic | Same flow for English + Arabic |
| **Repeatability** | Hard to re-run identically | One command / bat file |
| **Traceability** | Weak for audits | URL + runtime + result archive |

---

## Business Value for Leadership

### 1. Faster release confidence

QA can validate CPC changes before email/campaign go-live without burning a full day on dropdown checks.

### 2. Lower risk of customer-facing defects

Wrong country code, nationality, or residence values hurt data quality and preference accuracy. Automation catches mismatches systematically.

### 3. Stronger audit and stakeholder proof

Reports show what was tested, on which URL, how long it took, and which values passed/failed — useful for audits, UAT sign-off, and status updates.

### 4. Scalable across parks / brands

The same pattern works for Motiongate, DPR, LEGOLAND, and other assets. Once built, reuse reduces cost per brand instead of rebuilding manual checklists each time.

### 5. Better use of skilled people

Testers spend less time on repetitive clicking and more on exploratory testing, edge cases, and campaign validation.

### 6. Reliable regression

After SFMC / Cloud Page / profile logic changes, the same suite can be re-run quickly to confirm nothing broke.

---

## Simple ROI Framing (Example)

If one manual pass for 15 values × multiple fields × EN + AR takes roughly **2–4 hours**, and automation does the same in a fraction of that with a reusable report:

- **Time saved per cycle** → faster UAT / sanity cycles  
- **Fewer escaped defects** → fewer production fixes and customer impact  
- **Reusable asset** → cost amortizes across every future run and brand  

Even if automation is used only for sanity/regression before each major CPC or email change, the cumulative saving and risk reduction are significant.

---

## One-Liner for Executives

> These scripts replace hours of repetitive, error-prone CPC dropdown checks with a consistent, auditable, bilingual automation suite that verifies Save behavior at scale and produces evidence-ready reports — so we ship preference-center changes faster, with higher confidence and lower operational risk.

---

## FAQ Talking Points

**Why not keep doing this manually?**

- Manual checks do not scale when value lists grow or when multiple brands need the same coverage.  
- Fatigue causes missed mismatches; automation compares values exactly.  
- Manual evidence is hard to standardize; automation archives URL, duration, and row-level results every run.  
- Arabic + English doubles manual effort; automation runs both with the same structure.

---

## Typical Report Outputs

Each automated run can produce:

- Comparison table (HTML + JSON)  
- Pass / fail / mismatch per value  
- Page URL used for the run  
- Total time taken  
- Archived results under locale-specific folders (English / Arabic)

---

*Common document for CPC automation initiatives across assets.*
