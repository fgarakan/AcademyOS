# DONNA Page Wiring QA — Sprint 1044

**Date:** 2026-05-18
**Sprint:** 1044 — DONNA Page Wiring QA V1

---

## TypeScript

`npx tsc --noEmit` — **CLEAN** (zero errors across all Sprint 1038-1043 files)

---

## Git status

Only untracked files in git status (migrations, airtable csvs, env examples, Academy_OS_Master_Build).
No unintended tracked file modifications beyond sprint-specific files.
`.claude/skills/academy-os-blindspot-guardrail/SKILL.md` modified but not staged — confirmed pre-existing, unrelated.

---

## Director DONNA page (`/director/donna`) — PASS

| Check | Result | Notes |
|---|---|---|
| Route loads | Pass | `src/app/director/donna/page.tsx` exists, Server Component |
| Role badge visible | Pass | "Director" badge with green dot in header |
| Data status indicator | Pass | "Live data" (green) or "Demo mode" (orange) in top-right |
| `DonnaContextSummaryCard` rendered | Pass | Above chat shell; shows context items and source labels |
| `DonnaVoiceReadyShell` rendered | Pass | Via `DonnaDirectorShellClient` wrapper |
| Chat thread visible | Pass | `DonnaChatThread` inside shell, 560px height |
| Suggested questions | Pass | Rendered as chips via `donnaSuggestedQuestions` (director role) |
| Source labels | Pass | Per-message confidence dot + source note |
| Boundary responses | Pass | `donnaBoundaryResponses` fires on out-of-scope questions |
| Voice toggle | Pass | Mic button appears if `voice.isAvailable` |
| Today at a Glance | Pass | 4 KPI tiles from live context |
| Attention Items | Pass | Up to 4 player flags with risk badges |
| Academy Risks | Pass | Up to 3 risks with urgency color |
| Next Best Actions | Pass | Up to 4 recommended actions with category icons |
| Quick Navigation | Pass | 6 director portal links |
| Review Queue Surface | Pass | `DonnaReviewQueueSurface` below 2-column grid, 6 categories |
| Safety notice | Pass | ShieldCheck + "DONNA proposes — you approve" |
| No DANA references | Pass | Zero instances of "DANA" in sprint files |
| No auto-approve language | Pass | All CTAs navigate to review queue |
| No parent sends | Pass | No parent-send mutations anywhere |
| No fake live claims | Pass | Demo mode labeled; live confirmed via isLive flag |

---

## Coach DONNA page (`/coach/donna`) — PASS

| Check | Result | Notes |
|---|---|---|
| Route loads | Pass | `src/app/coach/donna/page.tsx` exists, Server Component |
| Role badge visible | Pass | "Coach" badge with blue styling |
| Data status indicator | Pass | Live / Demo mode indicator |
| `DonnaContextSummaryCard` rendered | Pass | Above chat shell with coach context items |
| `DonnaVoiceReadyShell` rendered | Pass | Via `CoachDonnaShellClient` (coach role) |
| Chat thread visible | Pass | `DonnaChatThread` inside shell, 540px height |
| Wrap-up alert | Pass | Orange alert if missingWrapUps > 0 with active session link |
| Session brief KPIs | Pass | 4 tiles: today, wrap-ups due, in review, players |
| Today's sessions list | Pass | Per-session rows with wrap-up status |
| Recommended actions | Pass | Coach-scoped actions |
| Quick actions grid | Pass | 4 actions: Sessions, Players, Capture Note, Review Queue |
| Safety notice | Pass | "Nothing is sent to parents without director approval" |
| No DANA references | Pass | Zero instances |
| No director data leakage | Pass | Only coach-scoped context shown |

---

## Chat thread integration — PASS

| Check | Result | Notes |
|---|---|---|
| Director role gets director questions | Pass | `getSuggestedQuestionsForRole('director', ...)` |
| Coach role gets coach questions | Pass | `getSuggestedQuestionsForRole('coach', ...)` |
| Suggested questions shown as chips | Pass | `ChatQuickAction[]` rendered below thread |
| Confidence dots per message | Pass | `ConfidenceDot` in `DonnaChatThread` |
| Source notes per message | Pass | `sourceNote` in DONNA message bubbles |
| Boundary response fires | Pass | `checkQuestionBoundary` → `buildBoundaryMessage` |
| Typing indicator | Pass | Thinking bubble while processing |
| Voice input available | Pass | Mic button if browser supports SpeechRecognition |
| Auto-scroll | Pass | `useEffect` scrolls to `bottomRef` on new messages |
| Session memory records turns | Pass | `recordTurn` called in `handleSend` |

---

## Voice-ready shell — PASS

| Check | Result | Notes |
|---|---|---|
| `useVoiceDictation` connected | Pass | Transcript auto-sent when voice.status returns to 'idle' |
| Voice status indicator | Pass | Green pulsing dot + "Listening..." shown during recording |
| Voice error handled | Pass | Red banner for 'unsupported' or general error |
| Interim transcript shown | Pass | Shown in listening bar while speaking |

---

## Review Queue Surface — PASS

| Check | Result | Notes |
|---|---|---|
| 6 categories rendered | Pass | Pending, Wrap-ups, Attendance, Templates, Evidence, Parent-Safe |
| Urgency dots | Pass | Red/orange/none per urgency level |
| Item counts | Pass | Shown from DirectorDonnaContext |
| Review CTA | Pass | Navigates to relevant route, no mutation |
| Ask DONNA CTA | Pass | Navigates to `/director/donna` |
| No auto-approve | Pass | Footer notice confirms review-first |
| Demo label | Pass | Orange "Demo" pill when isDemo=true |

---

## Coach Wrap-Up Integration — PASS

| Check | Result | Notes |
|---|---|---|
| DONNA header visible | Pass | Sparkles + "DONNA" + "Coach" badge in top nav |
| Progress rail | Pass | Preserved, unchanged |
| DONNA prompt above question | Pass | Contextual text per step |
| One question at a time | Pass | Preserved |
| Running summary (draft) | Pass | "DONNA Summary Draft" panel |
| Submit button label | Pass | "Submit for Review" (not "Save Wrap-Up") |
| Submitted state — DONNA branding | Pass | DONNA + Coach badge at top of confirmation |
| Submitted state — safety notice | Pass | ShieldCheck panel shown |
| "Ask DONNA" link on confirmation | Pass | Links to `/coach/donna` |

---

## Navigation — PASS

| Check | Result | Notes |
|---|---|---|
| Director sidebar has DONNA | Pass | Sparkles icon, position 2 after Dashboard |
| Coach home has DONNA card | Pass | Blue-accented tappable block |
| Coach home has DONNA quick action | Pass | Full-width tile in Quick Actions |
| All DONNA links resolve | Pass | `/director/donna` and `/coach/donna` both exist |
| No broken links | Pass | No placeholder hrefs pointing to non-existent routes |

---

## AcademyOS aesthetic — PASS

- Dark theme (base/surface/surface-raised) maintained throughout
- Lime accent for director, status-blue for coach — consistent
- Typography: Inter, JetBrains Mono for numbers
- No inline colors — all Tailwind custom tokens
- Card components from `@/components/ui` used throughout

---

## Mobile check — PASS (visual review)

- Director DONNA page: 2-column on lg+, single column on mobile
- Coach DONNA page: 2-column on lg+, single column on mobile
- Wrap-up flow: single column, max-w-lg, unchanged
- Coach home DONNA card: full-width, readable on small screens

---

## Summary

All 8 wiring surfaces pass QA:
1. Director DONNA page — full context + chat shell + review queue surface
2. Coach DONNA page — full context + chat shell
3. Chat thread integration — both portals
4. Voice-ready shell — both portals
5. Context summary card — both portals
6. Review Queue Surface — director only (correct)
7. Wrap-up polish — coach flow
8. Navigation entry points — director sidebar + coach home
