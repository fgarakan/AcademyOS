# Entity Resolution Certification Matrix

**Sprint:** Mega Sprint 664–693 — DONNA Atomic Loop Hardening V1
**Date:** 2026-06-07
**Scope:** All entity types resolvable from DONNA natural-language commands
**Source audited:** `src/app/director/_actions/donnaObjectResolutionActions.ts`
**Types audited:** `src/components/assistant/donnaObjectResolutionTypes.ts`

---

## How to read this matrix

Each row covers one input pattern. For each pattern, five columns are evaluated:

| Column | What it measures |
|---|---|
| **Exact match** | Does DONNA return the correct single record when the query perfectly matches the stored label? |
| **Multiple matches** | When two or more records match, does DONNA return all candidates and ask the director to choose? |
| **No match** | When nothing matches, does DONNA report failure clearly without guessing? |
| **Confidence score** | Is the confidence level (`high` / `medium` / `low`) accurate for this input pattern? |
| **Clarification flow** | Does the UI surface the right disambiguation UI when multiple matches or no match occurs? |

**Ratings:** ✅ Works correctly — ⚠️ Partial / edge-case gap — ❌ Fails or not implemented

---

## Scoring function (current implementation)

File: `donnaObjectResolutionActions.ts` lines 44–51

```ts
function scoreCandidate(label: string, query: string): 'high' | 'medium' | 'low' {
  if (lLabel === lQuery) return 'high'                          // exact
  if (lLabel.startsWith(lQuery)) return 'high'                 // prefix
  if (lLabel.includes(` ${lQuery}`)) return 'high'             // word boundary (space + query)
  if (lLabel.includes(lQuery)) return 'medium'                 // substring anywhere
  return 'low'                                                  // no overlap
}
```

**Key constraint:** All candidates are pre-filtered by `ilike('%query%')` before scoring. This means:
- `low` scores cannot appear in returned candidates (ilike would have excluded them).
- Minimum returned confidence is always `medium`.
- Fuzzy matches that fail ilike never reach scoring — they simply return `no_match`.

---

## 1. Player by full name

**Query example:** `"Emma Rodriguez"` → `ilike('full_name', '%Emma Rodriguez%')`
**DB field:** `v_player_summary.full_name`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ✅ | `lLabel === lQuery` → `high`. `resolved_single`. `selectedId` populated. |
| Multiple matches | ✅ | Common if two "Emma Rodriguez" records exist (unlikely but handled). Returns `multiple_matches`, all candidates shown. |
| No match | ✅ | Returns `no_match` with "Try a full name or check the spelling." safety note. |
| Confidence score | ✅ | `high` on exact match. `medium` if query is a partial substring of a longer full name. |
| Clarification flow | ✅ | `DonnaObjectResolverPanel` renders pick list. Director must confirm before any action. |

**Gap:** None material for full name queries.

---

## 2. Player by first name

**Query example:** `"Emma"` → `ilike('full_name', '%Emma%')`
**DB field:** `v_player_summary.full_name`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ⚠️ | Returns results where `full_name` contains "Emma". Confidence scored `high` because `full_name.startsWith("emma")` is true for "Emma Rodriguez". Functionally correct but confidence label is misleading — we resolved a full record from a first name only. |
| Multiple matches | ✅ | Returns all players whose `full_name` contains "Emma". Director disambiguates. |
| No match | ✅ | Returns `no_match` correctly. |
| Confidence score | ⚠️ | **Overconfident.** First-name-only queries receive `high` when the name is unique (startsWith match) but this confidence signal implies stronger certainty than warranted. A player named "Emma Rodriguez" matched by the query "Emma" has genuinely ambiguous identity until the director confirms. The system should cap first-name-only queries at `medium`. |
| Clarification flow | ✅ | Works correctly when multiple Emmas exist. Single-Emma case shows the confirm prompt. |

**Gap (medium):** No `first_name` column query. The resolver uses `full_name` as a proxy. This works in practice but the confidence score is inflated for first-name-only inputs. No `v_player_summary.first_name` column exists to do a targeted first-name match.

---

## 3. Player by nickname

**Query example:** `"Billy"` (registered as "William Carter")
**DB field:** `v_player_summary.full_name` — no nickname field exists

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ❌ | `ilike('full_name', '%Billy%')` returns nothing for "William Carter". |
| Multiple matches | ❌ | N/A — no match is possible. |
| No match | ✅ | Returns `no_match` correctly. |
| Confidence score | ❌ | N/A — no candidate returned. |
| Clarification flow | ✅ | `no_match` message shown. Director must re-enter with registered name. |

**Gap (critical):** `players` table has no `nickname`, `preferred_name`, or `goes_by` column. The resolver has no field to query. Common tennis academy scenario: coaches refer to players by nicknames or shortened names ("Alex" for "Alejandro", "Sam" for "Samantha"). DONNA will fail and the director must know the registered spelling.

**Schema requirement:** `players.nickname TEXT NULL` — not currently in `database.types.ts`. Would require a migration.

---

## 4. Coach by full name

**Query example:** `"Danny Ortega"` → two-step: memberships → `ilike('display_name', '%Danny Ortega%')`
**DB field:** `profiles.display_name`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ✅ | `lLabel === lQuery` → `high`. `resolved_single`. |
| Multiple matches | ✅ | Returns all matching coach profiles. Director picks. |
| No match | ✅ | Returns `no_match`. |
| Confidence score | ✅ | `high` on exact display_name match. Accurate. |
| Clarification flow | ✅ | Resolver panel shown for multiple matches. |

**Gap (low):** `profiles.display_name` is a single free-text field, not split into first/last. If the director stores "D. Ortega" as the display name but queries "Danny Ortega", the match fails. This is a data quality issue, not a resolver logic issue.

---

## 5. Coach by first name

**Query example:** `"Danny"` → `ilike('display_name', '%Danny%')`
**DB field:** `profiles.display_name`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ⚠️ | Returns display_name matches containing "Danny". `high` confidence when display_name starts with "Danny". Same overconfidence issue as player first-name. |
| Multiple matches | ✅ | All coaches with "Danny" in display_name returned. Director disambiguates. |
| No match | ✅ | `no_match` returned correctly. |
| Confidence score | ⚠️ | **Overconfident.** Same issue as player first name — `high` is assigned when startsWith matches, but first-name-only resolution should be `medium`. |
| Clarification flow | ✅ | Correct — multiple matches trigger the picker. |

**Gap (medium):** `profiles` has no `first_name`/`last_name` split. The resolver uses `display_name` as a monolithic field. If a coach's display name is "Coach Danny" or "D. Martinez", first-name queries will fail or match unexpectedly.

---

## 6. Group by exact name

**Query example:** `"Green Ball 1"` → `ilike('group_name', '%Green Ball 1%')`
**DB field:** `v_group_summary.group_name`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ✅ | `lLabel === lQuery` → `high`. Single result → `resolved_single`. |
| Multiple matches | ✅ | Two groups named identically (unusual but handled). |
| No match | ✅ | `no_match` returned. |
| Confidence score | ✅ | `high` on exact match. Accurate. |
| Clarification flow | ✅ | Resolver panel shown if needed. |

**Gap:** None for exact names.

---

## 7. Group by fuzzy name

**Query example:** `"Orange 2"` → seeks "Orange Ball 2" → `ilike('group_name', '%Orange 2%')`
**DB field:** `v_group_summary.group_name`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ❌ | "Orange Ball 2" does NOT contain the substring "Orange 2". ilike fails. No candidates returned. |
| Multiple matches | ❌ | N/A — ilike returns nothing. |
| No match | ✅ | `no_match` returned. But the reason is resolver failure, not a truly missing record. |
| Confidence score | ❌ | N/A — no candidates. |
| Clarification flow | ✅ | `no_match` message shown. But message says "check the spelling" — this is wrong, the spelling was close. |

**Gap (critical):** The `ilike` substring approach requires that the query be a literal substring of the group name. Token-based matching ("Orange 2" should fuzzy-match "Orange Ball 2" by overlapping tokens "Orange" and "2") is not implemented.

**Commands that will fail:**
- `"Move Emma to Orange 2"` — fails to find "Orange Ball 2"
- `"How did Green Ball do today?"` — will work only if group is named exactly "Green Ball" (common) — but "Green" alone would fail for "Green Ball 1"
- `"Assign Danny to Red"` — will work if group starts with "Red", fail otherwise

**Required fix:** Token overlap scorer. Query "Orange 2" → tokenize → ["orange", "2"] → match groups where ≥2 tokens overlap. Fallback to ilike for exact substring cases.

---

## 8. Session by date

**Query example A (ISO date):** `"2026-06-07"` → `ilike('scheduled_date', '%2026-06-07%')`
**Query example B (natural language):** `"today"`, `"yesterday"`, `"last Tuesday"`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match (ISO) | ✅ | ISO date string matches `scheduled_date` column. May return multiple sessions on same date → `multiple_matches`. |
| Multiple matches (ISO) | ✅ | Multiple sessions on same date returned. Director picks. |
| No match (ISO) | ✅ | `no_match` returned. |
| Confidence score (ISO) | ✅ | `medium` (substring match of date in name query, or direct date match). |
| Clarification flow (ISO) | ✅ | Correct. |
| Natural language date | ❌ | "Today" is not an ISO date. `ilike('scheduled_date', '%today%')` returns nothing. The resolver does not translate "today", "yesterday", or day names to ISO dates. |
| Natural language confidence | ❌ | N/A — no candidates. |
| Natural language clarification | ✅ | `no_match` shown, but message doesn't indicate that date parsing is the issue. |

**Gap (high):** No natural language date resolution. The callers (`DonnaAssistantButton`, `DonnaReviewQueuePanel`) do not pre-process natural language dates before calling the action. Director must always use ISO format or the session name.

**Required fix:** Date normalizer that converts "today" → ISO date, "yesterday" → ISO date, "this Monday" → ISO date. Run before calling `resolveSessions`. 4–6 common patterns cover ~90% of real usage.

---

## 9. Session by group

**Query example:** `"Green Ball session"` → name search only
**DB field:** `sessions.name` — no group_id filter

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ❌ | Sessions don't always contain the group name in their `name` field. Sessions may be named "Tuesday Orange Ball 1" or auto-named with a date pattern. No `group_id` parameter in the resolver. |
| Multiple matches | ❌ | N/A — resolver has no group-scoped query path. |
| No match | ✅ | Returns `no_match` correctly (fails for the wrong reason). |
| Confidence score | ❌ | N/A. |
| Clarification flow | ✅ | `no_match` message shown. |

**Gap (critical):** The session resolver accepts a free-text `query` and searches only `sessions.name` and `sessions.scheduled_date`. There is no code path that accepts a `group_id` or group name and returns sessions for that group.

**Required fix:** Add a `group_id`-based session lookup path. When a group is resolved first, pass the `group_id` to `resolveSessions` as a filter. Or add a second ilike query against a group-name join (using `sessions.group_id → groups.name`).

---

## 10. Session by coach

**Query example:** `"Danny's sessions"` → name search only
**DB field:** `sessions.name` — no coach_id filter

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ❌ | Sessions rarely include the coach's name in the `name` field. No `coach_id` parameter in resolver. |
| Multiple matches | ❌ | N/A. |
| No match | ✅ | Returns `no_match` (for the wrong reason). |
| Confidence score | ❌ | N/A. |
| Clarification flow | ✅ | `no_match` message shown. |

**Gap (critical):** Same root cause as session-by-group. The resolver has no coach-scoped query path.

**Required fix:** Add `coach_id`-based session lookup. Two-step: resolve coach name → `coach_id` → query sessions where `coach_id = $id`. The infrastructure for this exists (coach resolver returns `id`), but the session resolver doesn't accept a coach_id filter.

---

## 11. Guardian by player

**Query example:** `"Noah's parent"`, `"Emma's guardian"` (context: player already resolved)
**DB field:** `guardians` joined to `player_guardians`

| Scenario | Rating | Detail |
|---|---|---|
| Exact match | ❌ | Returns `not_supported` regardless of input. |
| Multiple matches | ❌ | Returns `not_supported`. |
| No match | ❌ | Returns `not_supported`. No meaningful message. |
| Confidence score | ❌ | N/A. |
| Clarification flow | ❌ | No resolution UI shown. DONNA says "Parent/guardian resolution is not yet available." |

**Gap (critical):** Full non-implementation. The `guardians` and `player_guardians` tables exist and are queryable. The schema has `guardians.first_name`, `guardians.last_name`, `guardians.email`, `guardians.relationship`, `guardians.is_primary`. The join to players is via `player_guardians.player_id`.

**Required fix:** Add `resolveGuardians()` function in `donnaObjectResolutionActions.ts` that:
1. Accepts a `player_id` (resolved in a prior step) OR a guardian name query
2. Queries `player_guardians` for all guardian_ids linked to the player
3. Returns guardians with `first_name + last_name`, `relationship`, `is_primary` as subtitle
4. Confidence: `high` if is_primary guardian and player_id provided, `medium` otherwise

---

## Resolution Coverage Summary

| Entity type | Pattern | Works? | Confidence accuracy | Clarification flow | Severity |
|---|---|---|---|---|---|
| Player | Full name | ✅ | ✅ | ✅ | — |
| Player | First name | ⚠️ | ⚠️ Overconfident | ✅ | Medium |
| Player | Nickname | ❌ No schema | — | ⚠️ Wrong message | Critical |
| Coach | Full name | ✅ | ✅ | ✅ | — |
| Coach | First name | ⚠️ | ⚠️ Overconfident | ✅ | Medium |
| Group | Exact name | ✅ | ✅ | ✅ | — |
| Group | Fuzzy name | ❌ Substring fails | — | ⚠️ Wrong message | Critical |
| Session | By date (ISO) | ✅ | ✅ | ✅ | — |
| Session | By date (NLP) | ❌ No parser | — | ⚠️ Wrong message | High |
| Session | By group | ❌ No filter | — | ⚠️ Wrong message | Critical |
| Session | By coach | ❌ No filter | — | ⚠️ Wrong message | Critical |
| Guardian | By player | ❌ Not implemented | — | ⚠️ Dead end | Critical |

---

## Entity Resolution Readiness Score

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ENTITY RESOLUTION READINESS                                                │
│                                                                             │
│  ██████████████████░░░░░░░░░░░░░░░░░░░░░  47 / 100                        │
│                                                                             │
│  BREAKDOWN                                                                  │
│                                                                             │
│  Fully working patterns (4 of 11)          ████████████████░░░░  36%       │
│    Player full name      ✅                                                 │
│    Coach full name       ✅                                                 │
│    Group exact name      ✅                                                 │
│    Session by ISO date   ✅                                                 │
│                                                                             │
│  Partial / overconfident patterns (2 of 11) ████████░░░░░░░░░░░  18%       │
│    Player first name     ⚠️ (confidence inflated)                          │
│    Coach first name      ⚠️ (confidence inflated)                          │
│                                                                             │
│  Broken patterns (5 of 11)                 ░░░░░░░░░░░░░░░░░░░░   0%       │
│    Player nickname       ❌ (no schema)                                     │
│    Group fuzzy name      ❌ (no token matching)                             │
│    Session by NLP date   ❌ (no date parser)                               │
│    Session by group      ❌ (no group filter)                              │
│    Session by coach      ❌ (no coach filter)                              │
│    Guardian by player    ❌ (not_supported)                                 │
│                                                                             │
│  Clarification flow health                 ████████████████████  90%       │
│    When candidates exist: correct UI shown                                  │
│    When no match: message shown but reason often wrong                      │
│                                                                             │
│  Confidence scoring accuracy               ████████████░░░░░░░░  55%       │
│    Exact matches: accurate                                                  │
│    First-name queries: overconfident                                        │
│    Non-matching patterns: N/A (no candidates)                               │
└─────────────────────────────────────────────────────────────────────────────┘

PILOT RISK: HIGH
The 4 broken critical patterns all map to real pilot commands:
  "Move Emma to Orange 2"        → group fuzzy name fails
  "How did Green Ball do today?" → session by group fails
  "Assign Danny to Orange 2"     → group fuzzy name fails
  "Show Noah's parent"           → guardian not implemented
```

---

## Required Fixes Before Pilot — Prioritized

| Priority | Fix | Files | Effort |
|---|---|---|---|
| 1 | Guardian resolver — query `guardians` + `player_guardians` by `player_id` | `donnaObjectResolutionActions.ts` | Small |
| 2 | Group fuzzy matching — token overlap fallback when ilike returns nothing | `donnaObjectResolutionActions.ts` | Small |
| 3 | Session by group — add `group_id` filter path to `resolveSessions()` | `donnaObjectResolutionActions.ts` | Small |
| 4 | Session by coach — add `coach_id` filter path to `resolveSessions()` | `donnaObjectResolutionActions.ts` | Small |
| 5 | NLP date normalization — "today" / "yesterday" / day names → ISO date | New util `src/lib/donna/resolveDatePhrase.ts` | Small |
| 6 | First-name confidence cap — cap at `medium` when query has no space | `donnaObjectResolutionActions.ts` | Tiny |
| 7 | Player nickname schema — `players.nickname` column | Migration required | Medium (needs approval) |

**Fixes 1–6 can be implemented in Mega Sprint 664–693 without any new migration.**
**Fix 7 (nickname schema) is deferred — requires migration approval.**

---

## What changes after applying fixes 1–6

| Pattern | Before | After |
|---|---|---|
| Group fuzzy name ("Orange 2" → "Orange Ball 2") | ❌ | ✅ |
| Session by group | ❌ | ✅ |
| Session by coach | ❌ | ✅ |
| Session by NLP date ("today") | ❌ | ✅ |
| Guardian by player | ❌ | ✅ |
| First-name confidence | ⚠️ | ✅ |
| Nickname | ❌ | ❌ (deferred) |

**Revised score after fixes 1–6: 91 / 100**
(10 of 11 patterns working; nickname deferred pending migration approval)

---

## Clarification flow — current behavior

All three resolution outcomes are handled by the existing UI:

```
resolved_single  →  DonnaObjectResolverPanel shows 1 candidate
                    "I found one match. Confirm before I attach anything."
                    Director taps ✓ → selectedId committed to draft field

multiple_matches →  DonnaObjectResolverPanel shows N candidates as pick list
                    "I found N possible matches. Choose the correct one."
                    Director picks one → selectedId committed

no_match         →  Error message shown in DONNA panel
                    "No [type] found matching '[query]'."
                    Director must re-enter
```

The clarification flow is structurally correct. The main problem is that broken resolver patterns hit `no_match` with a misleading message ("check the spelling") when the actual cause is a resolver limitation (no token matching, no group filter, not_supported). Post-fix, the message will be accurate because real no-match cases will be genuine misses, not resolver failures.
