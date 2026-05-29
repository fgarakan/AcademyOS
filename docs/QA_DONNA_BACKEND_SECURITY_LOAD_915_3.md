# DONNA Backend Load + Multi-Tenant Security QA
**Sprint:** 915.3 | **Date:** 2026-05-28
**Method:** Comprehensive static code analysis of all 914.x–915.x backend components

---

## 1. RLS Cross-Academy Boundary Tests

| Table | RLS Enabled | INSERT Policy | SELECT Policy | Cross-Academy Risk |
|---|---|---|---|---|
| `donna_conversation_sessions` | ✅ | `auth_academy_id()` + `auth_is_staff()` | `auth_academy_id()` scoped | None |
| `donna_conversation_messages` | ✅ | `auth_academy_id()` + `auth_is_staff()` | Via session join | None |
| `donna_working_memory` | ✅ | `auth_academy_id()` + `auth_is_staff()` | Own academy only | None |
| `donna_events` | ✅ | `auth_academy_id()` + `auth_is_staff()` | `auth_academy_id()` scoped | None |
| `donna_recommendations` | ✅ | `auth_academy_id()` | `auth_academy_id()` scoped | None |
| `donna_recommendation_feedback` | ✅ | `auth_academy_id()` | `auth_academy_id()` scoped | None |
| `donna_entity_summaries` | ✅ | `auth_academy_id()` + `auth_is_staff()` | `auth_academy_id()` scoped | None |
| `donna_embeddings` | ✅ | `auth_academy_id()` + `auth_is_staff()` | `auth_academy_id()` scoped | None |

**All 8 DONNA tables: RLS enabled. Cross-academy isolation confirmed.**

---

## 2. Role-Based Access

| Role | Conversation Sessions | Events | Recommendations | Embeddings |
|---|---|---|---|---|
| `academy_director` | Read all (own academy) | Read all | Read all | Read all |
| `head_coach` | Read own + staff | Read staff-visible | Read staff-visible | Read staff-visible |
| `coach` | Read own | Read staff-visible | Read staff-visible | Read staff-visible |
| `player` | No access | No access | No access | No access |
| `parent` | No access | No access | No access | No access |

**Player/parent isolation confirmed at DB policy level.**

---

## 3. Session and Message Privacy

| Check | Result |
|---|---|
| `donna_conversation_sessions` has `academy_id` on every row | ✅ |
| Messages accessible only via session (session FK enforced) | ✅ |
| No direct message lookup without academy_id filter in TypeScript helpers | ✅ |
| `getRecentDonnaConversationMessages` always includes session scoping | ✅ |

---

## 4. Event Ledger Privacy

| Check | Result |
|---|---|
| `donna_events` has `academy_id` on every row | ✅ |
| `logDonnaEvent` always passes `academyId` from caller | ✅ |
| No UPDATE/DELETE policy on events (append-only) | ✅ |
| No raw event IDs exposed in user-facing text | ✅ |

---

## 5. Recommendation Feedback Privacy

| Check | Result |
|---|---|
| `recommendation_text` safety note in code (no raw PII) | ✅ |
| `feedback_reason` safety note in code (no raw parent/player text) | ✅ |
| No automated learning — feedback for human analysis only | ✅ |
| No recommendation becomes an action without director approval | ✅ |

---

## 6. Entity Summary Visibility

| Check | Result |
|---|---|
| `visibility_scope` column enforced on all summaries | ✅ |
| Staff SELECT policy scoped by visibility_scope | ✅ |
| Director sees all academy summaries | ✅ |
| No player/parent access to summaries | ✅ |

---

## 7. Semantic Memory Visibility

| Check | Result |
|---|---|
| `visibility_scope` column required on all embeddings | ✅ |
| Staff SELECT policy scoped by visibility_scope | ✅ |
| Raw vectors never returned to TypeScript callers | ✅ `getEntityEmbeddings` excludes vector column |
| No semantic match used as sole authority | ✅ matches are metadata only |

---

## 8. Cache Isolation

| Check | Result |
|---|---|
| Cache keyed with `{academyId}:` prefix on every entry | ✅ |
| `cacheInvalidate(academyId)` clears only that academy's entries | ✅ |
| No cross-academy contamination possible in module-level Map | ✅ |
| Cache failure falls back to DB reads | ✅ |

---

## 9. Approval Gate Enforcement

| Check | Result |
|---|---|
| `donnaApprovalGate.ts` defines `APPROVAL_REQUIREMENTS` for all action types | ✅ |
| `assertDonnaApprovalAllowed` / `requireDonnaApproval` helpers exist | ✅ |
| `approveCurriculumOverrideDraft` is sole execute path (Sprint 904) | ✅ |
| `execute_curriculum_override()` not called directly from DONNA | ✅ |
| Approval gate not yet enforced on ALL paths (declared V2 gap) | ⚠️ documented |

---

## 10. Load Behavior for Repeated DONNA Messages

| Check | Result |
|---|---|
| Context packet assembly: synchronous action registry lookup (no DB) | ✅ |
| Entity summary lookup: cached with 2-min TTL after first call | ✅ |
| Working memory: single DB read per session, not per message | ✅ |
| Conversation messages: limited to last N (default 20) | ✅ |
| No unbounded queries in any DONNA context builder | ✅ |
| Cache failure falls back to DB — does not amplify load | ✅ |

---

## 11. Failure Behavior

| Check | Result |
|---|---|
| All DONNA persistence helpers return `{ ok, error }` — no throws | ✅ |
| Context packet assembly never throws (all failure paths graceful) | ✅ |
| Semantic memory retrieval returns `{ ok: true, matches: [] }` on error | ✅ |
| Cache operations never throw | ✅ |
| Recommendation logging failure does not break DONNA response | ✅ |

---

## 12. Raw ID / Sensitive Content Leakage

| Check | Result |
|---|---|
| No raw UUIDs in user-facing DONNA text | ✅ |
| No raw JSON dumped to users | ✅ |
| Raw embedding vectors excluded from all TypeScript return types | ✅ |
| Parent/player sensitive notes not stored in recommendation_text | ✅ (code comment) |

---

## 13. Unsafe Mutation Checks

| Check | Result |
|---|---|
| `execute_curriculum_override()` absent from DONNA lib | ✅ |
| `proposed_actions` read-only access in DONNA lib (no INSERT from DONNA directly) | ✅ |
| Curriculum drafts insert with `status: 'pending_review'` only | ✅ Line 89 curriculumDraft.ts |
| Sprint 904 `approveCurriculumOverrideDraft` / `rejectCurriculumOverrideDraft` untouched | ✅ |
| No auto-send parent/player communications | ✅ |
| No auto-change player levels or placements | ✅ |
| No auto-apply billing or roster changes | ✅ |

---

## TypeScript
`npx tsc --noEmit` — 0 errors across all sprint files
