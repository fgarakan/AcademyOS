# Sprint 1097 — DONNA Guardrail Consistency Pass V1

## Audit scope

Verified guardrail notices and safety properties across all 4 DONNA role surfaces.

---

## Guardrail Notice Inventory

| Page | Component | Icon | Color | Text |
|---|---|---|---|---|
| `/player/ask-donna` | `Shield` | `w-4 h-4` | `text-status-blue` | "DONNA shares coach-approved context only. No rankings, no pressure, no private notes." |
| `/parent/ask-donna` | `Shield` | `w-4 h-4` | `text-status-blue` | "DONNA shares coach-approved guidance only. No rankings, no comparisons, no private notes." |
| `/coach/donna` | `ShieldCheck` | `w-4 h-4` | `text-lime` | "DONNA helps you prepare, capture, and submit. Your wrap-ups, observations, and notes go into the director review queue — nothing is sent to parents or applied to player profiles without director approval." |
| `/director/donna` | `ShieldCheck` | `w-4 h-4` | `text-lime` | "DONNA proposes — you approve. No session note, player observation, attendance record, parent communication, or curriculum change takes effect until you review and approve it in the Review Queue." |

---

## Consistency findings

| Rule | Player | Parent | Coach | Director |
|---|---|---|---|---|
| Has guardrail notice | PASS | PASS | PASS | PASS |
| Notice visible without scrolling | PASS — near top of page | PASS — near top of page | PASS — bottom of page | PASS — bottom of page |
| No external AI API calls | PASS — static chips | PASS — static chips | PASS — deterministic shell | PASS — deterministic shell |
| No raw coach notes exposed | PASS | PASS | PASS — read-only context | PASS — read-only context |
| No rankings | PASS | PASS | PASS | PASS |
| No player comparisons | PASS | PASS | PASS | PASS |
| No UTR display | PASS | PASS | PASS | PASS |
| No automatic mutations | PASS | PASS | PASS — review queue pipeline | PASS — review queue pipeline |
| Role-appropriate language | PASS — calm, supportive | PASS — calm, supportive | PASS — operational | PASS — executive |

---

## Icon consistency note

Player/parent DONNA uses `Shield` (status-blue) — appropriate for consumer-facing guardrail notice.
Coach/director DONNA uses `ShieldCheck` (lime) — appropriate for staff operational safety notice.
Both variants are intentional and role-appropriate.

---

## Footer safety copy

| Page | Footer text |
|---|---|
| `/player/ask-donna` | "DONNA is a guided assistant — not a replacement for your coach. Talk to your coach first." |
| `/parent/ask-donna` | "DONNA provides parent guidance only. For coaching questions, speak directly with your child's coach." |
| `/coach/donna` | (no footer — has inline safety notice) |
| `/director/donna` | (no footer — has inline safety notice) |

---

## No issues found

All 4 DONNA surfaces have appropriate guardrail notices. Language is role-calibrated. No safety violations.

## TypeScript

Clean — no code changes this sprint.
