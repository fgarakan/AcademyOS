---
name: academy-os-trust-data-guard
description: Guards data provenance, source citation, and demo/live honesty in AcademyOS. Use before any sprint that adds new data displays, KPI signals, DONNA recommendations, or demo/sandbox content. Prevents fake data from feeling live, AI-generated content from appearing authoritative, and signals from hiding their source or confidence level.
---

# AcademyOS Trust Data Guard

## Purpose

Director trust is the foundation of AcademyOS adoption. A director who cannot tell where a signal came from — or whether it reflects real data — will not act on it. A director who discovers that demo data felt live will not trust the product.

This skill ensures every data surface in AcademyOS is honest about:
- What the data is (live / partial / demo / draft)
- Where it came from (voice intake / KPI engine / AI draft / deterministic rule)
- How confident the system is (sufficient data / insufficient / blocked)
- What happens next (what the director can do with it)

---

## When to Use

Use this skill before any sprint that:

- Adds a new KPI signal or Academy Health metric
- Adds DONNA recommendations or next best actions
- Shows player development signals or risk flags
- Adds any content that could be AI-generated (wrap-ups, parent drafts, level signals)
- Adds demo or sandbox data to any director-facing view
- Changes how `DonnaStatusDisclosureRow` or status badges are rendered
- Adds a new data source (CSV import, voice intake, external API)

---

## Trust Taxonomy

Every data signal shown in a director-facing view must carry a status that matches one of these:

| Status | Meaning | UI Treatment |
|---|---|---|
| `live` | Real data, sufficient records, computed correctly | No qualifier — show the value |
| `partial` | Some data present, some records missing or recent | "Partial data" label in muted text |
| `insufficient_data` | Too few records to compute reliably | "Not enough data yet" — show empty state |
| `no_data` | No records exist for this signal | Empty state component |
| `blocked_by_rls` | Row-level security prevents access | "Access restricted" — never show a zero as if it is real |
| `blocked_by_schema` | Table or column does not exist yet | "Coming soon" — never show placeholder data as real |
| `demo` | Sandbox data only | "Demo" badge — never omit this label |
| `draft` | AI-generated, not yet reviewed or approved | "Draft — needs review" — never present as final |

Never show a `demo` value without the "Demo" badge. Never show a `draft` value with confident present-tense framing ("Alex is ready for Level 3"). Use conditional framing ("DONNA suggests Alex may be ready — review to confirm").

---

## Source Citation Rules

Every DONNA recommendation or KPI signal must disclose its source when the source is not obvious:

- **Voice intake signals**: label as "From session notes" or "DONNA structured from coach input"
- **KPI engine signals**: label with the engine name (e.g., "Academy Health — Attendance Engine")
- **AI-generated drafts**: label as "AI draft — not reviewed" or "DONNA draft"
- **Deterministic rules**: no label needed (the output speaks for itself)
- **Imported data**: label as "From import — [date]"
- **Manual entry**: no label needed

Source disclosure must appear:
- In review queue items (`proposed_actions`)
- In DONNA recommendation chips
- In `DonnaStatusDisclosureRow` for KPI cards
- In parent draft items before director sends

---

## Demo Data Rules

Demo and sandbox data is scoped to the `[DEMO]` prefix in `academy_id` or record names:

- All demo records are tagged with `[DEMO]%` prefix
- Demo actions are scoped in `demoSandboxActions.ts`
- No demo action can mutate real academy data (`assertNotPreviewMode()` guards this)
- Every demo-facing view must show the "Demo Mode" banner
- Never allow demo session data to appear in the live review queue

---

## `DonnaStatusDisclosureRow` Usage

`DonnaStatusDisclosureRow` is the standard component for surfacing data quality in KPI cards. Use it whenever a KPI card shows a signal that is not `live` with sufficient data.

Do not replace it with a custom disclaimer or omit disclosure to make the UI look cleaner. A clean UI that hides data quality uncertainty is a trust violation.

---

## Pre-Sprint Checklist

1. Does every new KPI signal carry a status from the trust taxonomy?
2. Does every `demo` or `draft` value display a visible label that distinguishes it from `live`?
3. Does every DONNA recommendation disclose its source?
4. Does `DonnaStatusDisclosureRow` appear for all non-live KPI signals?
5. Does AI-generated content use conditional framing instead of confident assertions?
6. Does any new demo content appear in a live director queue without a "Demo" label?
7. Does a new import or external data source disclose its origin in the UI?
8. Does the new signal degrade gracefully when data is `insufficient_data` or `blocked_by_rls`?

---

## Hard Stop Conditions

Stop and ask before proceeding if a sprint would:

- Display a `demo` value without a "Demo" badge in any director-facing view
- Display an AI-generated `draft` with confident present-tense framing
- Remove or hide `DonnaStatusDisclosureRow` from any existing KPI card
- Allow a `blocked_by_rls` or `blocked_by_schema` signal to show as a zero or an error
- Surface demo session data in the live review queue
- Introduce a new data source without a source label in the DONNA output
- Let a `partial` signal appear as `live` without qualification

---

## AcademyOS-Specific Rules

- KPI engines return `status` as one of: `live`, `partial`, `insufficient_data`, `no_data`, `blocked_by_rls`, `blocked_by_schema`. Match the UI treatment to the status.
- `EmptyState` components handle `no_data` — never show null or a blank section without a reason.
- The Academy Health score uses a composite status — if any sub-signal is `partial`, the composite card must show `partial`.
- `proposed_actions` items must always show `source_type` and `confidence` fields in the review queue UI.
- DONNA TTS reads output — ensure spoken text does not include status qualifiers that only make sense visually (e.g., do not speak "bracket Demo bracket").

---

## Commit Rule

```bash
git commit -m "Sprint XXX — Sprint Name"
```

Single line only. No `Co-Authored-By`. No AI attribution.

---

## Required Output Format

```
## Trust Data Guard Report — Sprint XXX

**Surface:** [which view(s) affected]
**Status taxonomy compliance:** [all signals use trust taxonomy / flag: what is unlabeled]
**Demo/draft labeling:** [all demo and draft values labeled / flag: what is missing badge]
**Source citation:** [all DONNA signals cite source / flag: what is uncited]
**DonnaStatusDisclosureRow:** [present for all non-live signals / flag: what is missing]
**Graceful degradation:** [insufficient/blocked states handled / flag: what crashes or shows zero]
**Demo isolation:** [no demo data in live queue / flag: what crosses]

**Hard stops triggered:** [none / list]

**Verdict:** CLEAR / HOLD — [reason if hold]
```
