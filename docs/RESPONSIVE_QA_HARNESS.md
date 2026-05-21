# Responsive QA Harness

> Sprint 461 — QA Checklist V1
> See also: `docs/MOBILE_INTERACTION_PATTERNS.md`, `docs/DESKTOP_COMMAND_CENTER_PATTERNS.md`

---

## How to use this

For each surface below, test at three viewport widths:
- **Mobile:** 375px (iPhone SE)
- **Tablet:** 768px (iPad portrait)
- **Desktop:** 1440px (MacBook)

Mark each item: ✓ Pass / ⚠ Issues / ✗ Fail

---

## Director — Desktop (1440px)

| Check | Status |
|---|---|
| Sidebar renders at w-60, not collapsed | |
| Main area fills `flex-1 ml-60` | |
| DONNA floating button visible at bottom-right | |
| Dashboard KPI grid shows 4 columns | |
| Active nav item: lime accent, left border | |
| Pending badge count on Review Queue item | |
| Preview banner shows if in preview mode | |
| Three-column command center layout correct | |
| Split-pane approval center functional | |

## Director — Mobile (375px)

| Check | Status |
|---|---|
| Sidebar collapses or becomes drawer | |
| Content fills full width | |
| DONNA button accessible without sidebar collision | |
| Approval cards full-width, large tap targets | |
| KPI tiles stack to single column | |
| Player cards readable | |
| No horizontal overflow | |

## Coach — Mobile (375px)

| Check | Status |
|---|---|
| BottomTabBar at bottom, 5 items visible | |
| Content above tab bar (pb-24 on body) | |
| Home page loads upcoming sessions | |
| Sessions tab links to /coach/sessions | |
| Recap tab links to /coach/recap | |
| Players tab links to /coach/players | |
| DONNA tab links to /coach/donna | |
| DONNA floating button renders above tab bar | |
| No content hidden behind tab bar | |

## Coach — Tablet (768px)

| Check | Status |
|---|---|
| Content max-w-2xl centered | |
| Tab bar still functional | |
| Session cards readable | |
| Recap flow works | |

## Parent — Mobile (375px)

| Check | Status |
|---|---|
| Portal loads parent-safe content only | |
| No coach-internal notes visible | |
| Development summary only shown if show_to_parent=true | |
| Progress visible only if is_parent_visible=true | |
| BottomTabBar shows: Home, Progress, Updates, Wins | |
| Language is encouraging, not clinical | |

## Player — Mobile (375px)

| Check | Status |
|---|---|
| Portal loads player-safe content only | |
| No internal coach notes visible | |
| Mission map / mission cards visible | |
| Level progress visible | |
| Badge earned visible | |
| Feedback only shown if coach-approved | |
| Language is motivating, not grade-like | |

## DONNA Panel — All viewports

| Check | Status |
|---|---|
| Floating button visible and accessible | |
| Panel opens without blocking primary content | |
| Input accepts both text and voice | |
| Responses shown in chat format | |
| DONNA thinking state shows | |
| Panel can be minimized | |
| Proposed actions show as reviewable cards | |
| No raw sensitive data in panel | |

## Approval Center (Director)

| Check | Status |
|---|---|
| Pending count badge on nav item | |
| Queue shows items sorted by risk then age | |
| Selected item has lime left border | |
| Detail shows: type, affected, reasoning, risk | |
| Approve button is btn-lime | |
| Reject button is btn-danger | |
| Approved actions show success state | |

## Curriculum Viewer (Director)

| Check | Status |
|---|---|
| Levels visible with display names | |
| Requirements per level visible | |
| Badge status shown | |
| Mission count shown | |
| Navigation between levels works | |

## Template Builder (Director)

| Check | Status |
|---|---|
| Template list shows is_active templates | |
| Template detail shows blocks | |
| Template does not show duration_min (column does not exist) | |

## Player Profile (Director)

| Check | Status |
|---|---|
| 5 tabs: Overview, Skill Path, Competition, Fitness, Notes | |
| Overview: curriculum snapshot | |
| Notes: observations, priorities, evidence | |
| Parent-facing summary only shows if show_to_parent=true | |
| No raw AI output shown without review | |

## Parent Portal (Parent)

| Check | Status |
|---|---|
| Player card shows: name, level, group | |
| Development content only if show_to_parent=true | |
| Progress only if is_parent_visible=true | |
| Evidence only if is_parent_safe=true | |
| No coach_summary field exposed | |

## Player Portal (Player)

| Check | Status |
|---|---|
| Summary only if show_to_student=true | |
| Progress only if is_player_visible=true | |
| Missions visible | |
| Badges visible | |
| Coach feedback only if approved | |

---

## Dev-Only Diagnostic Route

`/dev/diagnostics` — feature flags, kill switches, DONNA health, demo readiness.

| Check | Status |
|---|---|
| Only accessible in non-production environments | |
| Demo readiness report shows pass/fail for each check | |
| Feature flags table accurate | |
| Kill switch states accurate | |

---

## Regression Checks (After Every Phase)

After each phase commit, re-verify:
- [ ] Director login → lands on /director
- [ ] Coach login → lands on /coach
- [ ] Player login → lands on /player
- [ ] Parent login → lands on /parent
- [ ] Middleware blocks cross-role access
- [ ] TypeScript: clean (`npx tsc --noEmit`)
- [ ] No console errors on /director load
- [ ] No console errors on /coach load
