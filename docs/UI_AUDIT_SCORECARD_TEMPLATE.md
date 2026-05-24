# UI/UX Audit Scorecard Template

**Standard:** AIQS — AcademyOS Interface Quality Standard v1.0
**Template version:** 1.0
**Usage:** Copy this file, fill in all sections. Do not modify product code until the audit is complete and fixes are approved.

---

# UI/UX Audit — [Page Name]

**Date:** YYYY-MM-DD
**Auditor:** [Claude / Name]
**Sprint context:** Sprint [NNN] — [if applicable]
**Page route:** `/[role]/[page]`
**Role:** director / coach / parent / player
**File audited:** `src/app/[role]/page.tsx`
**Above-fold components audited:** [list _components/ files]

---

## Final Score

**Score: __ / 100**

**Decision:**
- [ ] 90–100 — **READY** — Meets AcademyOS Interface Quality Standard
- [ ] 75–89 — **STRONG BUT NEEDS POLISH** — Demo-ready; noted gaps acceptable
- [ ] 55–74 — **USABLE BUT CLUTTERED** — Fix before next stakeholder review
- [ ] 35–54 — **HIGH COGNITIVE LOAD** — Needs redesign before use
- [ ]  0–34 — **NOT READY** — Significant rework required

**AIQS pass/fail gate:**
- [ ] PASS — No hard failures triggered
- [ ] FAIL — Hard failure(s) present (see below) — score capped at 54/100

---

## What This Page Is Supposed To Do

> _One paragraph. What is the page's job? What question does it answer for the user?_

---

## Current User Experience

> _One paragraph. What does the user likely feel when they land on this page?
> Is it calm? Overwhelming? Clear? Confusing? Premium? Admin-like?_

---

## AIQS Hard Failure Check

If **any** of these are true, the page fails AIQS. Check all that apply:

| Condition | Status | Notes |
|---|---|---|
| User cannot identify page purpose within 5 seconds | PASS / FAIL | |
| Multiple competing top command surfaces | PASS / FAIL | |
| More than one primary CTA above the fold | PASS / FAIL | |
| Important text under 14px or too low contrast | PASS / FAIL | |
| Mobile shows 10+ sections before the main action | PASS / FAIL | |
| DONNA duplicates page content instead of simplifying | PASS / FAIL | |
| Parent/player safe boundaries unclear | PASS / FAIL | |
| Official actions triggerable without review | PASS / FAIL | |
| Page feels like a database admin panel | PASS / FAIL | |

---

## Top 5 Problems

Ranked by severity (1 = most critical, 5 = least critical).

---

### Problem 1: [Title]

- **What it is:**
- **Why it hurts usability:**
- **Evidence:** `[component:line]` or `[description of layout/text]`
- **Fix recommendation:**
- **Expected impact:** [score improvement / UX benefit]

---

### Problem 2: [Title]

- **What it is:**
- **Why it hurts usability:**
- **Evidence:**
- **Fix recommendation:**
- **Expected impact:**

---

### Problem 3: [Title]

- **What it is:**
- **Why it hurts usability:**
- **Evidence:**
- **Fix recommendation:**
- **Expected impact:**

---

### Problem 4: [Title]

- **What it is:**
- **Why it hurts usability:**
- **Evidence:**
- **Fix recommendation:**
- **Expected impact:**

---

### Problem 5: [Title]

- **What it is:**
- **Why it hurts usability:**
- **Evidence:**
- **Fix recommendation:**
- **Expected impact:**

---

## Rubric Score Breakdown

| Category | Score | Max | Notes |
|---|---:|---:|---|
| Purpose clarity | | 10 | |
| Primary action clarity | | 10 | |
| Cognitive load | | 15 | |
| Visual hierarchy | | 10 | |
| Typography | | 10 | |
| Spacing / layout | | 10 | |
| Role fit | | 10 | |
| Accessibility | | 10 | |
| State quality | | 5 | |
| DONNA integration | | 5 | |
| Trust / safety | | 5 | |
| **Total** | | **100** | |

---

## Typography Audit

**Text too small (below minimum for its importance level):**
- [ ] None found
- [ ] `[component:line]` — `text-[Npx]` on `[what it says]` — should be at least `text-sm` (14px)

**Text too muted (low contrast for important content):**
- [ ] None found
- [ ] `[component:line]` — `text-text-muted` on `[important instruction]`

**Heading hierarchy issues:**
- [ ] None found
- [ ] [describe issue]

**Line-height issues:**
- [ ] None found
- [ ] [describe issue]

**Label clarity issues:**
- [ ] None found
- [ ] [describe issue]

---

## Layout Audit

**Section order:**
> _Is the most important section first? Does the order answer the user's top questions in priority order?_

**Duplicate surfaces:**
- [ ] None found
- [ ] [describe duplication]

**Spacing problems:**
- [ ] None found
- [ ] [describe cramped or over-spaced areas]

**Card density:**
- [ ] Consistent
- [ ] [describe inconsistencies]

**Scroll depth:**
- [ ] Primary action visible above fold
- [ ] Primary action requires __ px of scroll before reaching

**Desktop concerns:**
- [ ] None found
- [ ] [describe]

**Mobile concerns:**
- [ ] None found
- [ ] [describe — overflow, cramped tap targets, hidden content]

---

## Accessibility Audit

**Contrast risks:**
- [ ] None found
- [ ] `[element]` — `[color token]` on `[background]` — may not meet WCAG AA

**Focus state risks:**
- [ ] None found
- [ ] `[element]` — focus ring may not be visible

**Tap target risks:**
- [ ] None found
- [ ] `[element]` — estimated height `[Npx]` — below ~44px recommended

**Icon label risks:**
- [ ] None found
- [ ] `[icon element]` — no visible text or `aria-label`

**Keyboard navigation risks:**
- [ ] None found
- [ ] [describe]

---

## DONNA Audit

**Does DONNA reduce or increase cognitive load on this page?**
> _[Assessment]_

**Does DONNA duplicate content already visible on the page?**
- [ ] No
- [ ] Yes — [describe duplication]

**Does DONNA have clear safe actions on this page?**
- [ ] Yes
- [ ] No — [describe what is unclear]

**Are approval boundaries clear to the user?**
- [ ] Yes
- [ ] No — [describe what is unclear]

**DONNA surface position relative to primary content:**
- [ ] Subordinate / supporting
- [ ] Competing / dominant (issue)

---

## Recommended Fix Plan

### Quick wins
*Low code change, high UX impact. Can be done in < 1 sprint.*

1. [Fix] — `[file]` — [approach]
2. [Fix] — `[file]` — [approach]

### Medium fixes
*Component changes. ~1 sprint per item.*

1. [Fix] — `[file]` — [approach]
2. [Fix] — `[file]` — [approach]

### Larger redesign
*Multi-sprint. Requires planning.*

1. [Fix] — [scope] — [dependencies]

### Not now
*Deferred — out of scope, too risky, or requires new infrastructure.*

1. [Item] — [why deferred]

---

## Sprint Recommendation

**Sprint title:** Sprint [NNN] — [Page Name] AIQS [Category] Improvements V1

**Scope:**
> _1–3 sentences describing what the sprint changes, what it does not change, and expected score improvement._

**Files likely affected:**
- `src/app/[role]/page.tsx`
- `src/app/[role]/_components/[Component].tsx`
- `docs/[sprint-name].md`
- `docs/CHANGELOG.md`

**Expected score improvement:** __ → __ / 100

---

## Implementation Guardrails

**Files to touch:**
- [list]

**Files not to touch (protected):**
- `src/lib/supabase/database.types.ts` — generated only
- `supabase/migrations/*` — only with explicit migration approval
- `src/lib/donna/donnaUIActionDispatcher.ts` — DONNA dispatch internals
- `.env.local` — never touch
- Other sprint-protected files: [list]

**DB changes needed:** yes / no
*(If yes: migration must be explicitly approved in sprint prompt before proceeding)*

**Role safety preserved:** yes / no
*(Confirm no role sees content or controls they should not)*

**Official mutation gates preserved:** yes / no
*(Confirm no proposed_actions bypass, no one-click publish/send/level-move)*

---

## Audit History

| Sprint | Date | Score | Decision |
|---|---|---|---|
| Sprint [NNN] (this audit) | YYYY-MM-DD | __ / 100 | [decision] |

*(Add rows as re-audits are completed after fix sprints)*

---

## Reference

- Standard: `docs/ACADEMY_INTERFACE_QUALITY_STANDARD.md`
- Skill: `.claude/skills/academy-interface-quality-auditor/SKILL.md`
- Design tokens: `tailwind.config.ts`
- UI components: `src/components/ui/index.ts`
