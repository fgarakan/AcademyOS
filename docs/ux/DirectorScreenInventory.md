# Director Screen Inventory
## Mega Sprint 1900–1930 — AcademyOS Director Experience Reimagination V1
### Date: 2026-06-12

Decision: Keep / Merge / Remove / Replace / DONNA

---

## LEGEND

| Decision | Meaning |
|---|---|
| **KEEP** | Survives into Fable with minimal changes |
| **MERGE** | Folds into another page; current URL becomes redirect |
| **REMOVE** | Deleted entirely; zero user-facing functionality |
| **REPLACE** | Rebuilt from scratch with the same purpose but new design |
| **DONNA** | Functionality replaced by DONNA conversation, no dedicated page needed |

---

## PRIMARY PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director` | Command center: brief, priorities, alerts, wins | **REPLACE** | TODAY — rebuilt with 60-second operating surface | Remove legacy sub-components; new component hierarchy |
| `/director/kpi` | KPI dashboard charts | **MERGE** | TODAY → expandable "Academy Metrics" section | Director doesn't need a separate tab for this |
| `/director/players` | Player directory table | **REPLACE** | PLAYERS — DONNA summary first, table second | Add intelligence header |
| `/director/sessions` | Session list + management | **MERGE** | TODAY → "Sessions" section | Daily sessions belong on Today; archive accessible from Players |
| `/director/review` | Approvals queue | **KEEP** | APPROVALS — same concept, cleaner design | Add DONNA brief at top; reduce tab count |
| `/director/templates` | Class + fitness templates | **MERGE** | CURRICULUM → "Session Plans" | Templates are a curriculum/session tool, not a top-level activity |
| `/director/curriculum` | Curriculum command center | **REPLACE** | CURRICULUM — simplified 3-section design | Create / Improve / Review |
| `/director/coaches` | Coach directory | **KEEP** | COACHES — add intelligence header | Add DONNA summary on wrap-up rates |
| `/director/settings` | Academy settings | **REPLACE** | SETTINGS — expanded with DNA, philosophy, preferences | Consolidate all config here |

---

## CURRICULUM SUB-PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/curriculum/builder` | Curriculum setup, architect, evolution | **KEEP** | CURRICULUM → primary editing surface | Wire Evolution panel (Sprint 1865A) |
| `/director/curriculum/builder/DonnaCurriculumPanel` | Natural language curriculum editing | **KEEP** | CURRICULUM → Architect tab | Core interaction |
| `/director/curriculum/builder/CurriculumEvolutionPanel` | Reality-based recommendations | **KEEP** | CURRICULUM → Evolution tab | Needs to be wired in |
| `/director/curriculum/level/[levelId]` | Level detail view | **KEEP** | CURRICULUM → level drill-down | Accessible from Builder |
| `/director/curriculum/level/[levelId]/impact` | Level impact preview | **MERGE** | CURRICULUM → within level detail | Not a separate page |
| `/director/curriculum/map` | Visual curriculum map | **MERGE** | CURRICULUM → overview section | Fold into Builder landing |
| `/director/curriculum/guided` | Guided curriculum setup | **MERGE** | Onboarding wizard | Only relevant during setup |
| `/director/curriculum/learning` | Learning modules for directors | **REMOVE** | — | Not used, no clear purpose |
| `/director/curriculum/academy-version` | Academy-specific overrides | **MERGE** | CURRICULUM → Builder → advanced settings | Hidden from primary flow |
| `/director/curriculum/builder/add-drill` | Add drill sub-page | **MERGE** | CURRICULUM → within Builder modal | Should be inline, not a separate page |
| `/director/curriculum/builder/add-fitness` | Add fitness sub-page | **MERGE** | CURRICULUM → within Builder modal | Should be inline, not a separate page |
| `/director/curriculum/builder/impact-preview` | Impact preview sub-page | **MERGE** | CURRICULUM → within Builder | Should be inline modal |

---

## PLAYER SUB-PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/players/[playerId]` | Individual player profile | **KEEP** | PLAYERS → player profile | Core detail view |
| `/director/players/[playerId]/onboard` | Player onboarding stepper | **KEEP** | PLAYERS → onboarding flow | Core GROW workflow |
| `/director/players/active` | Active players filtered list | **MERGE** | PLAYERS → filtered view | Fold into main players page |
| `/director/players/new` | Create new player | **KEEP** | PLAYERS → "Add Player" | Keep but simplify |
| `/director/players/import` | Import players from CSV | **KEEP** | PLAYERS → "Import" option | Retain, make accessible |
| `/director/players/development-intake` | Development intake form | **MERGE** | PLAYERS → new player intake | Fold into new player flow |
| `/director/players/onboarding-review` | Review player onboarding | **MERGE** | APPROVALS → placement tab | This is an approval workflow |

---

## SESSIONS SUB-PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/sessions/[sessionId]` | Session detail | **KEEP** | TODAY → session detail | Core detail view |
| `/director/sessions/new` | Create session | **KEEP** | TODAY → "New Session" | Keep accessible |
| `/director/sessions/overview` | Sessions overview | **MERGE** | TODAY → sessions section | Fold into Today |
| `/director/sessions/archive` | Past sessions | **MERGE** | PLAYERS → session history | Accessible from player profile |

---

## COACHES SUB-PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/coaches/[coachId]` | Coach profile | **KEEP** | COACHES → coach profile | Core detail view |
| `/director/coaches/_components/InviteCoachForm` | Invite new coach | **KEEP** | COACHES → "Invite Coach" | Keep as action |

---

## APPROVALS SUB-PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/review/[actionId]` | Individual action review | **KEEP** | APPROVALS → detail view | Core approval flow |

---

## TEMPLATES SUB-PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/templates/class/[templateId]` | Class template detail | **MERGE** | CURRICULUM → session plans | Templates belong to Curriculum |
| `/director/templates/fitness/[templateId]` | Fitness template detail | **MERGE** | CURRICULUM → session plans | |
| `/director/templates/class/create` | Create class template | **MERGE** | CURRICULUM → new plan | |
| `/director/templates/fitness/create` | Create fitness template | **MERGE** | CURRICULUM → new plan | |
| `/director/templates/coach-preview` | Coach preview of template | **MERGE** | CURRICULUM → preview panel | Inline, not a page |
| `/director/templates/donna-suggestions` | DONNA template suggestions | **MERGE** | CURRICULUM → Architect | DONNA conversation handles this |
| `/director/templates/impact-preview` | Template impact preview | **MERGE** | CURRICULUM → within builder | Inline, not a page |

---

## DUPLICATE / LEGACY ROUTES

| Route | Current Purpose | Decision | Notes |
|---|---|---|---|
| `/director/today` | Legacy Today page | **REMOVE** | Redirect to `/director` |
| `/director/command-center` | Older command center | **REMOVE** | Superseded by `/director` |
| `/director/class-templates` | Class templates (unlisted) | **REMOVE** | Redirect to `/director/templates` |
| `/director/class-templates/[templateId]` | Class template (unlisted) | **REMOVE** | Redirect to `/director/templates/class/[templateId]` |
| `/director/fitness` | Fitness templates root | **REMOVE** | Redirect to `/director/templates/fitness` |
| `/director/fitness/templates` | Fitness templates list | **REMOVE** | Redirect to `/director/templates/fitness` |
| `/director/fitness/templates/[templateId]` | Fitness template detail | **REMOVE** | Redirect |

---

## INTELLIGENCE / DONNA PAGES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/donna` | DONNA conversation hub | **KEEP** | Global — accessible from floating button | Core interaction surface |
| `/director/donna-analytics` | DONNA analytics view | **MERGE** | APPROVALS | Approval analytics belong with approvals |
| `/director/donna-coo-demo` | COO demo page | **REMOVE** | — | Demo artifact, not production |
| `/director/signals` | Signals dashboard | **MERGE** | TODAY → signals section | Part of operating context |
| `/director/alerts` | Alerts list | **MERGE** | TODAY → alerts section | |
| `/director/attention` | Attention queue | **MERGE** | PLAYERS → "Needs Attention" filter | Attention is player-centric |
| `/director/improvement` | Improvement page | **MERGE** | CURRICULUM → Evolution tab | |
| `/director/ai-suggestions` | AI suggestions review | **MERGE** | APPROVALS | |
| `/director/level-up` | Level movement | **DONNA** | Player profile → advancement section | DONNA surfaces level-up recommendations in player profile |

---

## PLAYER MANAGEMENT FLOWS

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/placement` | Placement engine | **MERGE** | PLAYERS → onboarding flow | Accessible from new player |
| `/director/parents` | Parent management | **MERGE** | PLAYERS → player profile → parents tab | Parent = relationship of a player |
| `/director/private-lessons` | Private lesson requests | **MERGE** | APPROVALS or TODAY | Requests are an approval workflow |

---

## PLATFORM / INTERNAL TOOLS

These should never appear in Director navigation. Only accessible by platform team.

| Route | Decision | Notes |
|---|---|---|
| `/director/demo` | **REMOVE** from director nav | Platform tool — move to `/platform` |
| `/director/pilot-readiness` | **REMOVE** from director nav | Platform tool |
| `/director/support-diagnostics` | **REMOVE** from director nav | Platform tool |
| `/director/migration-verify` | **REMOVE** from director nav | Platform tool |
| `/director/friction` | **REMOVE** from director nav | Developer tool — keep as hidden route |

---

## CONFIGURE SURFACES

| Route | Current Purpose | Decision | Target in Fable | Notes |
|---|---|---|---|---|
| `/director/settings` | Basic academy settings | **REPLACE** | SETTINGS — expanded | Add DNA, philosophy, notification prefs |
| `/director/onboarding` | Academy setup wizard | **MERGE** | SETTINGS → "Re-run Setup" | After completion, becomes accessible from settings |
| `/director/assessment-template` | Assessment templates | **MERGE** | SETTINGS → Assessment Config | Configure-only surface |
| `/director/setup` | Setup redirect | **REMOVE** | Redirect to onboarding | Redundant |

---

## FINAL SCREEN COUNT

| Category | Current | Fable |
|---|---|---|
| Primary nav items | 9 + 2 system | 6 |
| Unique routes serving directors | ~50+ | ~20 |
| Duplicate/legacy routes | ~12 | 0 (redirects only) |
| Platform-only routes | ~5 in director nav | Moved to `/platform` |
| DONNA-replaced surfaces | 0 | ~5 |

---

## MIGRATION MAP: OLD → NEW

| Old Location | New Location | Type |
|---|---|---|
| `/director/kpi` | TODAY → Academy Metrics section | Merge |
| `/director/sessions` | TODAY → Sessions section | Merge |
| `/director/sessions/overview` | TODAY | Merge |
| `/director/today` | `/director` | Remove (redirect) |
| `/director/templates` | CURRICULUM → Session Plans | Merge |
| `/director/templates/**` | CURRICULUM → Session Plans | Merge |
| `/director/class-templates/**` | `/director/templates/**` | Remove (redirect) |
| `/director/fitness/**` | `/director/templates/fitness/**` | Remove (redirect) |
| `/director/ai-suggestions` | APPROVALS | Merge |
| `/director/donna-analytics` | APPROVALS | Merge |
| `/director/signals` | TODAY → signals section | Merge |
| `/director/alerts` | TODAY → alerts section | Merge |
| `/director/attention` | PLAYERS → Needs Attention filter | Merge |
| `/director/level-up` | PLAYERS → player profile | DONNA |
| `/director/improvement` | CURRICULUM → Evolution tab | Merge |
| `/director/placement` | PLAYERS → onboarding flow | Merge |
| `/director/parents` | PLAYERS → player profile → parents tab | Merge |
| `/director/private-lessons` | APPROVALS | Merge |
| `/director/players/onboarding-review` | APPROVALS → placement tab | Merge |
| `/director/players/active` | PLAYERS → filter | Merge |
| `/director/players/development-intake` | PLAYERS → new player | Merge |
| `/director/curriculum/map` | CURRICULUM → Builder overview | Merge |
| `/director/curriculum/guided` | Onboarding → curriculum step | Merge |
| `/director/curriculum/learning` | — | Remove |
| `/director/curriculum/academy-version` | CURRICULUM → advanced settings | Merge |
| `/director/curriculum/builder/add-drill` | CURRICULUM → Builder inline | Merge |
| `/director/curriculum/builder/add-fitness` | CURRICULUM → Builder inline | Merge |
| `/director/onboarding` | SETTINGS → Re-run Setup | Merge |
| `/director/assessment-template` | SETTINGS → Assessment Config | Merge |
| `/director/setup` | `/director/onboarding` | Remove (redirect) |
| `/director/command-center` | `/director` | Remove (redirect) |
| `/director/donna-coo-demo` | — | Remove |
| `/director/demo` | `/platform` | Remove from director |
| `/director/pilot-readiness` | `/platform` | Remove from director |
| `/director/support-diagnostics` | `/platform` | Remove from director |
| `/director/migration-verify` | `/platform` | Remove from director |
