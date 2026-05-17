# Director Trust Friction Audit — Sprint 750

**Sprint:** 750
**Date:** 2026-05-17

---

## Purpose

Identify every trust signal that could cause a skeptical director to doubt DONNA's recommendations or the system's honesty.

---

## Trust Audit by Surface

### Dashboard (`/director`)

| Signal | Source shown? | Confidence shown? | Status |
|---|---|---|---|
| Academy Health score | Yes (KPI engine) | Yes (data sufficiency label) | ✅ Pass |
| DONNA executive brief | Yes ("DONNA brief") | Yes (partial/live label) | ✅ Pass |
| Priority queue items | Yes (source_type in PA) | Yes (confidence field) | ✅ Pass |
| Review queue pending count | Live count from DB | N/A | ✅ Pass |

### Review Queue (`/director/review`)

| Signal | Source shown? | Status shown? | Confidence shown? | Pass |
|---|---|---|---|---|
| Wrap-up drafts | Coach name + session | Pending/Approved/Applied | Confidence score | ✅ |
| Voice intake drafts | "Director voice" | Pending | Confidence | ✅ |
| Curriculum override drafts | Director-authored | Pending | N/A | ✅ |
| Level-up signals | Evidence count + gates | Pending | Evidence threshold | ✅ |
| Parent update drafts | "DONNA draft" | Draft — not sent | N/A (no send) | ✅ |

### Player Profile (`/director/players/[playerId]`)

| Signal | Source shown? | Status | Pass |
|---|---|---|---|
| Development summary | `source: 'ai_draft'` shown | Labeled if AI draft | ✅ |
| Gap guidance | "Gap engine" label | Deterministic | ✅ |
| Advancement signal | Evidence count from gates | Threshold displayed | ✅ |
| Coach observations | Coach name + timestamp | Live | ✅ |
| Parent guidance preview | "Draft — not sent" | Labeled | ✅ |

### DONNA Command Center (`/director/command-center`)

| Signal | Trust concern | Mitigation | Pass |
|---|---|---|---|
| DONNA responses | Could feel like hallucination | Responses are deterministic V1 with live DB counts | ✅ |
| "What needs attention" | Could imply AI certainty | Response shows source (review queue count, attendance rate) | ✅ |
| Draft creation | Could imply execution | Response shows "Draft created — check review queue" | ✅ |

---

## Trust Anti-Patterns Checked

| Anti-Pattern | Present? | Evidence |
|---|---|---|
| AI-generated content displayed as authoritative fact | No | `source: 'ai_draft'` label always shown |
| Demo data displayed as live | No | `[DEMO]` badge + Preview Mode banner |
| "Insufficient data" shown as zero | No | `EmptyState` component for no_data status |
| DONNA implies certainty from partial data | No | `partial` status shown with "Partial data" label |
| Review queue item status ambiguous | No | 5-state status: pending / approved / applied / rejected / clarification_needed |
| Parent draft shows send button that doesn't work | No | No send button in V1 |

---

## Trust Friction Flags Found

### T1 — Academy Health composite score explanation could be clearer

**Severity:** Low
**Detail:** The composite score shows sub-signal sources but the weighting formula isn't explained. A skeptical director may want to know why score is 74% vs 82%.
**Mitigation:** DonnaStatusDisclosureRow shows individual sub-signal status and contribution.
**Recommendation:** Sprint 836 — Director Trust Audit should add a "How is this score calculated?" tooltip.

### T2 — DONNA voice command responses could show confidence more explicitly

**Severity:** Low
**Detail:** DONNA command center responses show live counts but don't explicitly say "This is based on 23 sessions since April 1."
**Mitigation:** Response copy mentions source inline.
**Recommendation:** Future enhancement — add date range context to DONNA response copy.

---

## Verdict

**Director trust friction audit: PASS with 2 low-severity flags.**

All major trust surfaces show source, confidence, and status. No anti-patterns detected. No demo data feels live. No AI content is presented as authoritative without labeling.

Trust flags T1 and T2 are low severity and acceptable at V1 pilot start.
