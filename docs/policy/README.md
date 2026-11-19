# Policy knowledge base

User-facing policies the assistant answers from. Every `.md` file here (except this README and
anything under `_original/` or other `_` folders) is read by the indexing pipeline in `ai/app/ingest/`.

## File format

```markdown
---
id: auction-rules                 # stable, unique; used as the source id in citations
title: Quy chế đấu giá            # shown when the assistant cites the document
audience: [producer, buyer]       # roles allowed to retrieve it: public, producer, buyer, coordinator, logistics, admin
lang: vi
version: 1.0
effective_date: 2026-11-05
rules: [lockMinutes]              # live operating rules used in the text (see below)
---

# Title (one H1 per file)

## Section
### One question or one rule per H3
```

## Writing rules

- **Owner file per topic.** Each topic is written in full in one file; other files give a one-line summary
  and name the owner. When a number changes, change it in the owner and in the summaries.

  | Topic | Owner |
  |---|---|
  | Roles, platform scope, transfer of risk, location privacy | `terms-of-use.md` |
  | Auctions (pre-harvest and price decay) | `auction-rules.md` |
  | Holds, deposits, cancellation, credit score | `hold-and-cancellation.md` |
  | Grades, shelf life, spoilage risk, cold chain, defect tolerance | `freshness-standards.md` |
  | Handover milestones, acceptance window, liability, rescue rerouting | `delivery-responsibility.md` |

- **Self-contained sections.** Each H3 is retrieved on its own, so name the subject again instead of
  writing "như trên" or "mục này".
- **Plain business language.** No internal technology names (databases, queues, locks, model names,
  table or event names), no LaTeX formulas, no `---` separators or callout blocks.
- **Admin-editable numbers are never written out.** Use `{{rule:<key>}}`; the pipeline fills in the
  current value from the API and re-indexes when an admin changes it. Keys:

  | Key | Meaning | Default |
  |---|---|---|
  | `lockMinutes` | Minutes a buyer has to pay the deposit after picking a batch | 15 |
  | `depositPercent` | Deposit on a normal (harvested) order, % of order value | 50 |
  | `holdHours` | Hours a producer has to confirm a hold | 24 |
  | `holdWarningHours` | Hours left on a hold when everyone is warned | 6 |
  | `signOffKg` | Holds of this many kg or more need a coordinator | 3000 |
  | `autoMatchMinScore` | Matches scoring at least this % are held automatically | 75 |
  | `dueSoonDays` | A demand needed within this many days is flagged | 3 |
  | `sellSoonDays` | Unsold kg within this many days of sell-by are listed first | 3 |
  | `coldChainMin` / `coldChainMax` | Safe temperature range for refrigerated trucks, °C | 2 / 8 |
