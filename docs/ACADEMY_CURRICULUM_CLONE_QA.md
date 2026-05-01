# Academy Curriculum Clone + Voice Customization — QA Checklist

**Sprint:** 70
**Last updated:** 2026-05-01

---

## Pre-conditions

- Supabase migrations 001–048 applied locally
- Director role: `academy_director` or `head_coach`
- An academy exists with at least one active player

---

## 1. Global Master Curriculum

| Check | Expected | Status |
|---|---|---|
| `/director/curriculum` loads | Page renders, shows 15 curriculum levels | — |
| `curriculum_levels` count | 15 | — |
| `curriculum_stages` count | 5 | — |
| Content items count | 29 (Orange Ball) | — |
| Global master is not editable by director | No edit controls on global data | — |

---

## 2. Academy Curriculum Version (Sprint 63)

| Check | Expected | Status |
|---|---|---|
| No active version → shows Create button | Shown | — |
| Create Academy Curriculum Version | Inserts row, shows Active | — |
| Creating again → shows "already exists" | No duplicate row created | — |
| Version card shows name, status, version_number, override count | All fields shown | — |
| Link to `/director/curriculum/academy-version` | Navigates | — |
| Academy ID resolved from authenticated profile | No client-supplied academy_id | — |
| Role check blocks non-director | Returns permission error | — |

---

## 3. Voice Override Draft Parser (Sprint 64)

| Check | Expected | Status |
|---|---|---|
| Input panel visible when active version exists | Shown | — |
| Input panel shows warning when no active version | Warning shown, button disabled | — |
| Submit with no text → button stays disabled | Button disabled | — |
| Submit "For our Orange 2 kids, I want more return-of-serve work before they move to Orange 3." | parsed_level = "Orange 2 — Direction", parsed_focus includes "return-of-serve" | — |
| Submit "More serve work for all Orange groups" | parsed_level = "Orange", parsed_scope = "academy" | — |
| Submit vague input with no level | warnings[] non-empty, clarification_questions[] non-empty | — |
| Draft created in proposed_actions with status = "pending_review" | Row exists with target_module = "curriculum_override" | — |
| No curriculum tables modified | curriculum_content_items, curriculum_levels unchanged | — |
| No AI called | All parsing deterministic | — |

---

## 4. Curriculum Override Review Queue (Sprint 65)

| Check | Expected | Status |
|---|---|---|
| `/director/review` shows Curriculum Override Drafts section | Section visible | — |
| Draft card shows raw input | Shown | — |
| Draft card shows parsed level, pathway, focus, scope | All fields shown | — |
| Draft card shows proposed change summary | Shown | — |
| Draft card shows warnings | Shown if present | — |
| Draft card shows clarification questions | Shown if present | — |
| Approve button records decision | status → "approved", approved_by set | — |
| Reject button records decision | status → "rejected" | — |
| Clarification needed button records decision | status → "clarification_needed" | — |
| Approving twice → error | "This draft has already been reviewed." | — |
| Non-director cannot review | Returns permission error | — |

---

## 5. Approved Override Application (Sprint 66)

| Check | Expected | Status |
|---|---|---|
| Approved draft shows "Apply Academy Curriculum Override" button | Shown | — |
| Applying creates academy_curriculum_overrides row | Row inserted with status = "applied" | — |
| Applied row has correct academy_id, curriculum_version_id | Verified | — |
| applied_by, applied_at set | Correct user and timestamp | — |
| audit_logs row written with action = "curriculum_override.applied" | Verified | — |
| proposed_action status → "executed" | Verified | — |
| Applying non-approved draft → error | "Only approved drafts can be applied." | — |
| Global curriculum tables unchanged | curriculum_content_items, curriculum_levels not touched | — |

---

## 6. Academy Version + Override List (Sprint 67)

| Check | Expected | Status |
|---|---|---|
| `/director/curriculum/academy-version` loads | Page renders | — |
| Version summary card shows name, status, version_number, applied count | Shown | — |
| Applied overrides list shows all applied rows | Shown | — |
| Empty state when no overrides | Shown | — |
| Rolled back overrides shown separately | Shown if any | — |
| Guardrail copy: "Your academy version is separate from the global curriculum." | Shown | — |

---

## 7. Diff / Impact Preview (Sprint 68)

| Check | Expected | Status |
|---|---|---|
| Diff card shows before snapshot or "Global default (no snapshot)" | Shown | — |
| Diff card shows proposed/applied change summary | Shown | — |
| Diff card shows affected level and focus | Shown | — |
| Downstream impact note shown | "Impact partially inferred" message shown | — |
| No live mutations from diff view | No DB writes from diff card | — |

---

## 8. Rollback (Sprint 69)

| Check | Expected | Status |
|---|---|---|
| Rollback button visible on applied overrides | Shown | — |
| First click → confirmation prompt | "Click again to confirm" shown | — |
| Second click → rollback executes | rollback record inserted, original marked "rolled_back" | — |
| Rollback record has rollback_of_override_id set | Verified | — |
| Original override status = "rolled_back" | Verified | — |
| audit_logs row with action = "curriculum_override.rolled_back" | Verified | — |
| Non-applied override → rollback button not shown | Rollback button only on status="applied" | — |
| Non-director → error | Permission error returned | — |
| Academy ID boundary enforced | Cannot rollback other academy's overrides | — |

---

## 9. Security and Data Integrity

| Check | Expected | Status |
|---|---|---|
| academy_id always from authenticated profile | Verified — never from client | — |
| All new tables have RLS enabled | academy_curriculum_versions ✓, academy_curriculum_overrides ✓ | — |
| RLS policies block cross-academy access | Staff can only read own academy | — |
| No service role used | All queries use anon/authenticated client | — |
| No RLS bypass | Confirmed | — |
| Parent/player routes not affected | No changes to /player or /parent routes | — |
| No player level mutations | Confirmed | — |
| No communications sent | Confirmed | — |

---

## Known Limitations (V1)

1. **Override-aware template population not implemented.** Applied overrides do not yet filter into template block population.
2. **Override-aware player requirement display not implemented.** Player profiles still show global defaults.
3. **Parent/player-safe summaries not override-aware.** V1 limitation documented in architecture doc.
4. **No original_snapshot captured.** The parser does not fetch the global default value at override creation time. Diff shows "Global default (no snapshot)" for before state.
5. **Deterministic parser is V1.** Complex multi-level inputs may not parse correctly. Clarification questions surface ambiguity.
6. **Migration 048 must be applied.** If not applied, the Academy Curriculum Version card shows "no active version" (safe fallback, no crash).
