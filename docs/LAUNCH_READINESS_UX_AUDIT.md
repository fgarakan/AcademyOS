# Launch Readiness UX Audit
**Academy OS — V1 Pilot**
Last updated: 2026-05-08

---

## Purpose

This document records the UX readiness status of each major screen and role flow ahead of the controlled pilot launch. It is a living doc — update status as issues are resolved.

---

## Roles in scope

| Role | Route prefix | Status |
|---|---|---|
| Academy Director | `/director` | ✅ Primary build target — mostly complete |
| Head Coach / Coach | `/coach` | ✅ Core flow complete |
| Player | `/player` | ✅ Basic IDP + mission view complete |
| Parent | `/parent` | ✅ Basic family portal complete |

---

## Director screens

| Screen | Route | Status | Notes |
|---|---|---|---|
| Command Center | `/director` | ✅ Ready | Setup checklist, NBA cards, curriculum coverage, priority queue |
| Players list | `/director/players` | ✅ Ready | Search, filters, curriculum level display |
| Player profile | `/director/players/[id]` | ✅ Ready | IDP, priorities, curriculum state, session history |
| Player import | `/director/players/import` | ✅ Ready | CSV dry-run + import flow |
| Development intake | `/director/players/development-intake` | ✅ Ready | Strengths/needs/priorities intake |
| Onboarding review | `/director/players/onboarding-review` | ✅ Ready | Placement queue |
| Curriculum | `/director/curriculum` | ✅ Ready | Explorer, customization assistant, loop diagram |
| Class templates list | `/director/class-templates` | ✅ Ready | Lesson plan status summary strip |
| Class template detail | `/director/class-templates/[id]` | ✅ Ready | Level assignment, draft generator, guided flow |
| Sessions | `/director/sessions` | ✅ Ready | Schedule view |
| Session detail | `/director/sessions/[id]` | ⚠️ Partial | Director view of session — confirm coach wrap-up links |
| Review queue | `/director/review` | ✅ Ready | Tabs: recap, priority, evidence, attendance, wrap-up |
| Signals | `/director/signals` | ✅ Ready | Alert cards |
| Private lessons | `/director/private-lessons` | ✅ Ready | Request cards + empty state improved |
| AI Suggestions | `/director/ai-suggestions` | ✅ Ready | Deterministic rule output |
| Demo Tour | `/director/demo` | ✅ Ready | 11-step guided path, sandbox controls |

---

## Coach screens

| Screen | Route | Status | Notes |
|---|---|---|---|
| Coach home | `/coach` | ✅ Ready | Sessions, players, notes — empty states improved |
| Sessions list | `/coach/sessions` | ✅ Ready | Today / upcoming / completed — empty states improved |
| Session detail | `/coach/sessions/[id]` | ✅ Ready | Before Session → Run → After Session flow |
| Player list | `/coach/players` | ✅ Ready | Group filter, curriculum level |
| Player detail | `/coach/players/[id]` | ⚠️ Check | Confirm curriculum level is shown |

---

## Player screens

| Screen | Route | Status | Notes |
|---|---|---|---|
| Player home | `/player` | ✅ Ready | Mission preview, development plan, session history with sparkline + ring |
| No-mapping state | `/player` (unlinked) | ✅ Ready | Warm copy, "mission is on its way" |

---

## Parent screens

| Screen | Route | Status | Notes |
|---|---|---|---|
| Parent home | `/parent` | ✅ Ready | Level card, support guide, attendance, lesson request |
| No-mapping state | `/parent` (unlinked) | ✅ Ready | Warm copy, "academy is preparing" |
| Duplicate "How to Support" | `/parent` | ✅ Fixed | Support guide suppresses duplicate IDP card |

---

## Known UX gaps (non-blocking for pilot)

1. **Director session detail** — Confirm coach wrap-up action is accessible from director view.
2. **Coach player detail** — Verify curriculum level display on coach-side player profile.
3. **Mobile layout** — Class template detail page has a multi-column sidebar that may compress on small screens. Acceptable for V1 (director role is desktop-first).
4. **No email/push notifications** — Communication is pull-only (parent checks portal). Fine for V1 with engaged parents.
5. **No group-level analytics** — Director sees individual player stats but no group-level session attendance aggregate. Post-V1.
6. **LevelProgressRing is static** — The SVG progress ring doesn't animate on entry (would need client-side JS). Cosmetic only.

---

## UX principles validated

- ✅ Empty states are warm and instructional (not cold "No data" messages)
- ✅ Every major empty state has context about what will appear and when
- ✅ Next Best Action cards guide directors through the setup loop
- ✅ Parent-safe content is sanitized — no internal coach language exposed
- ✅ All role portals use their correct layout (director: sidebar, coach/player/parent: bottom tabs)
- ✅ Setup progress checklist guides new directors through first 4 steps
- ✅ Curriculum loop diagram shows how content flows to court

---

## Pre-pilot sign-off checklist

- [ ] Director can complete full loop: player import → level assignment → template → lesson plan → session → review
- [ ] Coach can open session, see curriculum brief, mark attendance, and submit wrap-up
- [ ] Parent can see level, support guide, and attendance
- [ ] Player can see mission, development plan, and session history
- [ ] Demo tour page works for investor walkthrough
- [ ] All TypeScript checks pass (confirmed: Sprint 145–149 all clean)
- [ ] No console errors on golden path pages
- [ ] No broken links in nav or NBA cards
