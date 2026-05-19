# Sprint 1079 — Parent Portal Alignment Audit V1

## Existing Parent Portal State

### Files
- `src/app/parent/page.tsx` — Full home page (comprehensive, already built)
- `src/app/parent/layout.tsx` — Layout with BottomTabBar (Home, Progress, Wins, Updates)
- `src/app/parent/PrivateLessonRequestCard.tsx` — Private lesson request card (client component)
- `src/app/parent/requestPrivateLessonAction.ts` — Server action for lesson request via proposed_actions
- `src/app/parent/error.tsx` — Error boundary

### Parent Home Features (already built)
- Child identity via guardian → player_guardians → players chain (safe, never URL param)
- Current level + next level display
- `ParentSafeProgressPreview` component
- `ParentSupportGuide` (what to praise, at-home ideas, after-practice language, avoid overcoaching)
- `sanitizeParentFacingText` safety layer on all coach language before display
- Session attendance (last 60 days): count, rate, recent session list
- Private lesson request + status tracking via proposed_actions
- Approved data note + safety footer from IDP parent view
- Empty states for coach updates and messages

### Auth Pattern (parent)
Guardian → player_guardians → player (not URL params). Uses first linked player.

---

## Missing Tab Pages — To Build in Phase 7C

| Route | Tab | Sprint |
|---|---|---|
| `/parent/progress` | Progress | 1080 |
| `/parent/wins` | Wins | 1081 |
| `/parent/updates` | Updates | 1082 |
| `/parent/ask-donna` | (new tab) | 1083 |

---

## Phase 7C Sprint Plan

| Sprint | Deliverable |
|---|---|
| 1079 | This audit + stub pages |
| 1080 | Parent Progress Page V1 — level detail, observation domain counts, gate progress |
| 1081 | Parent Wins Page V1 — positive highlights count, session consistency, attendance streak |
| 1082 | Parent Updates Page V1 — coach update empty state with proper messaging, announcement placeholder |
| 1083 | Parent Ask DONNA V1 + Tab Update — guardrailed DONNA for parents, add DONNA to parent tabs |
| 1084 | Parent Development Focus Page V1 — dedicated priority/mission overview for parents |
| 1085 | Parent Support Guide Page V1 — expanded standalone support guide |
| 1086 | Parent Session History V1 — dedicated session history with attendance details |
| 1087 | Parent Portal Navigation Polish — tab cleanup, cross-links, DONNA integration |
| 1088 | Parent Portal QA V1 — full safety + navigation audit |
| 1089 | Parent Portal Polish V1 — final UX cleanup |

---

## Safety Rules for Phase 7C

- All parent-facing pages must use `sanitizeParentFacingText()` on any coach language fields before display
- Never show raw coach observations (content, not count)
- Never show rankings, UTR, win-loss record to parents
- Never compare this child to other players
- No internal director notes in parent view
- No coach notes flagged `show_to_parent = false`
- Player identity via guardian chain only — never URL params
- Content must be calm, positive, supportive

---

## Stubs Created This Sprint

- `src/app/parent/progress/page.tsx` — stub
- `src/app/parent/wins/page.tsx` — stub
- `src/app/parent/updates/page.tsx` — stub
- `src/app/parent/ask-donna/page.tsx` — stub

## TypeScript

Clean.
