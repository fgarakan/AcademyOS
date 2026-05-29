# QA — DONNA Tool Calling Contract V1
**Date:** 2026-05-29
**Sprint:** 942

---

## 1. TypeScript Validation
- [x] `npx tsc --noEmit` passes — clean
- [x] `donnaToolContract.ts` compiles
- [x] No imports from DB, React, or API layers

---

## 2. Tool Registry Completeness
- [x] 18 tools registered total
- [x] All 5 categories covered
- [x] Read tools (5): page context, pending count, KPIs, player, coach sessions
- [x] UI guidance (3): navigate, highlight, explain
- [x] Draft (5): attendance, coach note, parent summary, curriculum, advancement
- [x] Approval required (2): approve item, move level
- [x] Always blocked (3): send parent message, delete, bypass queue

---

## 3. Safety Classification
- [x] All `draft` tools have `requiresApproval: true`
- [x] All `approval_required` tools have `requiresApproval: true`
- [x] All `always_blocked` tools have `allowedRoles: []`
- [x] `draft_parent_summary` has `affectsParentOrPlayerVisibility: true`
- [x] `draft_player_advancement` has `affectsParentOrPlayerVisibility: true`
- [x] `move_player_level` has `affectsParentOrPlayerVisibility: true`
- [x] `send_parent_message_direct` is always_blocked with correct blockedReason
- [x] `bypass_review_queue` is always_blocked — architecture invariant enforced

---

## 4. Validation Function
- [x] `validateDonnaOutput({})` → invalid (missing required fields)
- [x] `validateDonnaOutput({ spokenAnswer: '', ... })` → invalid (empty answer)
- [x] `validateDonnaOutput({ confidence: 'invalid', ... })` → invalid
- [x] Valid full output → returns `{ valid: true, output, errors: [] }`

---

## 5. Lookup Helpers
- [x] `getDonnaTool('read_page_context')` returns tool
- [x] `getDonnaTool('nonexistent')` returns undefined
- [x] `isToolAllowedForRole('draft_parent_summary', 'director')` → true
- [x] `isToolAllowedForRole('draft_parent_summary', 'coach')` → false
- [x] `isToolAllowedForRole('send_parent_message_direct', 'director')` → false (always_blocked)
- [x] `isToolBlocked('bypass_review_queue')` → true
- [x] `buildBlockedToolResponse('bypass_review_queue')` → valid DonnaStructuredOutput with confidence: 'blocked'

---

## 6. Protected Systems
- [x] No app code modified
- [x] No shell routing changed
- [x] Sprint 904 paths untouched
- [x] No migrations
