# AcademyOS Executive Interaction Constitution V1

**Date:** 2026-06-29
**Status:** RATIFIED STANDARD — the permanent reference against which all future UI and workflow changes are evaluated.
**Type:** Interaction Architecture Audit (not a UI audit). Evaluates ownership, conversation, cognitive load, and deletion — not pixels.
**Method:** 11 parallel deep-read audits of the entire Director surface (78 routes, ~186 DONNA components), grounded in `file:line` evidence, reconciled against the locked laws in `EXECUTIVE_WORKSPACE_STANDARD.md`, `ACADEMYOS_UX_CONSTITUTION_V1.md`, `DONNA_ROUTING_CONSTITUTION_V1.md`, and `DONNA_CONVERSATIONAL_QUALITY_STANDARD.md`.

---

## 0. The Constitution (one screen)

> **Deep System. Calm Surface. Conversation First. Answer First. Evidence Second. Charts are Evidence — never Navigation. DONNA Owns Complexity. Directors Run Academies — not Software.**

Eight operating laws, derived from the audit and binding on every future change:

1. **One DONNA.** One conversation, one backend, one persistent thread across widget, page, and voice. Never three.
2. **Conversation owns verbs; pages own nouns.** DONNA *creates / schedules / assigns / drafts / summarizes / finds*. Pages *browse / open / confirm / record*. If a workflow can be finished without leaving the chat, the law is broken; if a workflow can only be started by filling a form, the law is also broken.
3. **Answer First, Evidence Second.** Every surface leads with DONNA's recommendation. Data, tables, and charts appear only behind a "show evidence" disclosure or because DONNA cited them.
4. **Charts are Evidence, never Navigation.** No KPI is a link to browse. A number exists only to support a recommendation.
5. **One owning page per workflow.** Never two implementations of the same object. Never a "new" demo tree shadowing a "legacy" real one.
6. **No fake surfaces.** No page renders hardcoded data as if live. No button that only flips local state. Demo data is labelled and isolated.
7. **Every mutation flows through `proposed_actions`.** One queue, one vocabulary (Approve / Hold / Dismiss). No parallel approval store, no second verb set.
8. **Delete before you improve.** The default disposition of a redundant surface is removal, not refinement.

---

## 1. Headline findings

The philosophy is already written and largely correct. **The gap is conformance and convergence, not vision.** The product has accreted faster than it has consolidated, producing four systemic diseases:

| # | Disease | Evidence |
|---|---|---|
| **D1** | **Surface sprawl** | 78 Director routes behind an 8-item sidebar. ~17 non-canonical/orphan routes. 3 redirect-only stubs. |
| **D2** | **Duplication of whole workflows** | 2 template trees · 3 onboarding systems · 3 session-list renderings · 9 player surfaces · 13 curriculum pages · 4 attention surfaces · parallel approval queue (`academy_suggestions` vs `proposed_actions`). |
| **D3** | **DONNA fragmentation & containment breach** | ~186 DONNA components; one **6,252-line** widget file; **3 disconnected conversation backends** with no shared thread; **33 accepted sidebar-containment violations** (a Director can complete ~13 workflows without leaving the chat). |
| **D4** | **Fake/decorative surfaces** | Curriculum `add-drill`/`add-fitness`/`impact-preview` render hardcoded drafts; the entire new Templates tree persists only review-request drafts (no usable template); onboarding's "Ask DONNA" box stores a note and does nothing; Dashboard mixes a self-labelled "demo" metric into the always-on grid. |

The counter-evidence is just as important: **the engines to do this right already exist** — `DirectorInterviewAssistant` (voice onboarding), `createPlayerDonnaAction` (conversational player creation), the real `DonnaAddDrillDraft`/`createClassTemplateWithBlocksAction` (real curriculum/template writes), `DirectorApprovalActionFlow` + `ImpactPreviewPanel` (answer-first decision cards), `buildAttentionItems` + `DonnaIntelligenceSignalsCard` (ranked attention), `CoachSupportNeededDashboard` (coach intelligence). **They are built and disconnected from the pages that need them.** The work is convergence, not invention.

---

## 2. The target navigation (7 destinations, down from an 8-item nav fronting 78 routes)

DONNA is the front door for *verbs*. The sidebar holds only the *nouns* a Director browses:

| Keep | Primary job | Major change |
|---|---|---|
| **Today** | The one thing that matters now + act on it in-thread | Absorbs Dashboard; one conversational brief, charts removed |
| **Players** | The roster (browse/open) + readiness brief | Absorbs `active`, `onboarding-review`; profile slimmed 9→4 tabs |
| **Curriculum** | See & edit the spine | 13 pages → 5; fake scaffolds deleted |
| **Templates** | The template library + real builder | 2 trees → 1 (legacy/real); DONNA drafts into it |
| **Coaches** | Coach intelligence (answer) + evidence roster | Lead with support verdict, demote roster |
| **Approvals** | The single decision queue (`proposed_actions`) | Answer-first cards; absorbs `ai-suggestions`; one verb set |
| **Settings** | Real academy config (the one true form) | Trim filler; the only legitimately form-shaped page |
| *Onboarding* (conditional) | One DONNA-led interview | 3 systems → 1 voice interview; pages confirm only |

**Removed as standing destinations:** Dashboard (→ Today), Sessions list/overview/archive (→ one list reached via DONNA + Today), Parents (→ DONNA + Approvals + guardian admin on profile), alerts/signals/attention (→ one DONNA attention stream), ai-suggestions (→ Approvals), kpi/setup/donna-coo-demo (delete), migration-verify/pilot-readiness/support-diagnostics/donna-analytics (dev-flag gate).

---

## 3. Scores

Scored 0–100. Higher is better (including Cognitive Load and Simplicity, where higher = lighter/simpler).

| # | Dimension | Score | One-line rationale |
|---|---|---|---|
| 1 | **Overall Executive Experience** | **43 / 100** | Answer-first surfaces exist and are good, but are drowned by walls, duplication, dead buttons, and fake data; the COO vision is visible but not yet felt. |
| 2 | **DONNA Integration** | **45 / 100** | DONNA is everywhere yet fragmented (3 backends, no continuity), decorative in key places, and breaches its own containment law in 33 spots; the intelligence is built but disconnected. |
| 3 | **Cognitive Load** | **30 / 100** | 9-tab profiles, 13-section session detail, 20-card review queue, Dashboard/Signals walls, 13 curriculum pages — load is consistently high. |
| 4 | **Executive Simplicity** | **32 / 100** | Heavy whole-workflow duplication, ~17 orphan routes, forms as the default front door, dead/fake controls. |
| 5 | **Conversation Ownership** | **38 / 100** | Conversation stops at every action boundary; onboarding, curriculum, sessions, and templates are form-first despite the engines to be conversation-first already existing. |

**Composite Executive Interaction Score: 38 / 100** — "Right philosophy, pre-convergence implementation." The ceiling is high because the laws and engines are in place; the score is low because the surfaces have not been consolidated against them.

Re-score after each roadmap phase. Target after Phase 3: ≥ 75 composite.

---

## 4. Per-page constitution

Disposition legend: **KEEP** · **SLIM** (keep, radically reduce) · **MERGE** · **DELETE** · **GATE** (dev-flag) · **CONVERT** (page → DONNA conversation).

### TODAY — `/director` · **SLIM (P0, High)**
- **Primary Job:** One sentence each morning — the single most important thing to do, with one inline action.
- **Problems:** ~13 stacked sections + 4 recharts charts; priorities triple-rendered (COO Hero / Command Brief / Attention); 5 competing "DONNA voices"; **zero conversational input** on the daily home; fabricated "Tomorrow" pulse + stubbed inputs; 5 orphan imported-by-nothing components (`DirectorDonnaDailyBrief`, `DonnaProactiveBriefCard`, `DonnaDailyCOOBriefSurface`, `AcademyTopPrioritiesPanel`, `DonnaSimplifiedPageHeader`) + `OnboardingProgressCard`.
- **Keep:** "if only one thing today" line; players-needing-attention ranking engine; the single primary CTA pattern; one calm health word.
- **Delete:** 4 charts + Intelligence Dashboard `<details>`; AcademyPulseTimeline (fabricated Tomorrow); duplicate health rings; the 6 orphan components; 2 of 3 priority renders.
- **DONNA Owns:** the whole daily narrative + the ability to draft → approve → done in-thread.
- **Page Owns:** only the handoff destinations.
- **Redesign:** one full-width DONNA brief (health word + greeting + the one priority + one inline `proposed_actions` action) → max 3 quiet "also today" lines → one "Open review queue (N)" link → everything else behind "Show evidence."

### DASHBOARD — `/director/dashboard` · **DELETE → Today (P0, High)**
- **Problems:** The KPI table **is** navigation (every cell links to a profile) — the clearest Charts-as-Navigation violation. No primary action. Demo metric mixed into a live grid. Duplicates Today + Players. ~877 lines of orphaned dashboard-wall components (`AcademyHealthBreakdown`, `AcademyKpiCardsSection`, `AcademyIntelligenceSection`) sit ready to re-mount.
- **Verdict:** Collapse into Today; redirect `/director/dashboard` → `/director`; remove from `SidebarNav`. Surface the one decision-grade number (at-risk count) as a DONNA sentence. Delete the 3 orphan wall components (optionally harvest `deriveInsights` into the brief). `/director/kpi` (redirect) confirms the precedent — finish the job.

### PLAYERS DIRECTORY — `/director/players` · **SLIM (P1, Med)**
- **Problems:** Two competing "Add Player" primaries; three overlapping DONNA widgets (brief + draft list + presence CTA) before the first name.
- **Strength:** `playersBrief` is genuine Answer-First; counts rendered as prose, not tiles — the model the rest of the app should copy.
- **Redesign:** one DONNA header → one "Add player" (opens DONNA) → roster. Add an "Active" filter chip (absorbs `/players/active`). Surface "N need setup" as a brief draft (absorbs `/players/onboarding-review`).

### PLAYER PROFILE — `/director/players/[playerId]` · **SLIM (P0, High)**
- **Problems:** The most overloaded screen in the product — **9 tabs**, ~14 Overview cards, **4 overlapping KPI surfaces** (Constitution Hero + Command Center + KPI Drilldown + Domain Summary), an Evidence Hub no executive asked for, **three** parent-preview panels, **30+ DB queries** in one server component. A data wall, not an answer.
- **Keep:** header, one merged signal card, curriculum level/gate confirm, notes capture, assessment history.
- **Delete:** KPI Drilldown, Domain Summary, Evidence Hub (→ one drawer), all 3 parent-preview panels, Q&A preview, Session History tab, duplicate Command Center.
- **DONNA Owns:** the answer ("Maria is one gate from Green; serve evidence is thin — draft the readiness note?") + all drafts.
- **Redesign:** header → one DONNA answer block (status + the single next decision + draft CTA) → max 4 tabs (Overview, Development, Competition, Notes) → all evidence behind one "Evidence" drawer.

### ADD PLAYER — `/director/players/new` · **CONVERT (P1, High)** — `createPlayerDonnaAction` already exists; default to conversation, demote the 5-field form to "enter manually."
### PLAYER IMPORT — `/director/players/import` · **KEEP (P2, Low)** — correct page-owned bulk work with a dry-run diff; the model for "page owns structured volume."
### ACTIVE PLAYERS — `/director/players/active` · **DELETE (P1, Med)** — duplicate of Directory with 4 vanity KPI tiles; replace with a filter chip.
### DEVELOPMENT-INTAKE — `/director/players/development-intake` · **MERGE/DELETE (P2, Med)** — triplicates dev-data entry (import columns + profile editor already cover it).
### ONBOARDING-REVIEW — `/director/players/onboarding-review` · **DELETE (P1, Med)** — a manual readiness-audit DONNA should narrate in one sentence.
### ONBOARD STEPPER — `/director/players/[playerId]/onboard` · **MERGE → Placement (P0, High)** — Steps 3–6 reimplement the Placement Engine; DONNA only narrates a 6-step form.
### PLACEMENT ENGINE — `/director/placement` · **KEEP as canonical onboarding queue (P0, High)** — make this *the* DONNA-led assess → recommend → confirm → activate surface; absorb the stepper; **reconcile the `academy_levels` vs `curriculum_levels` split-brain.**

> **Players group:** 9 surfaces → 5 (Directory · Profile · Add-via-DONNA · Import · Placement). The most-duplicated area; the conversational engine already exists and is merely buried under forms and wizards.

### CURRICULUM — landing `/director/curriculum` · **SLIM (P1, High)** — two buttons → one URL; a directory-of-pages tool launcher; collapse to brief + health strip + one primary action.
### CURRICULUM BUILDER — `/director/curriculum/builder` · **KEEP (P2)** — the legitimate role-gated work surface; the consolidation anchor.
### ADD-DRILL / ADD-FITNESS / IMPACT-PREVIEW (builder) · **DELETE (P0, High)** — **fake mock scaffolds**: hardcoded drafts, save buttons that flip local state, disabled scope controls; the *real* draft components already live in the level builder. A trust-guardrail violation, not just clutter.
### GUIDED REVIEW — `/director/curriculum/guided` · **DELETE (P0, High)** — a 477-line wizard that freezes DONNA's judgment into static strings; "walk me through what's incomplete" is a 30-second conversation.
### MAP — `/director/curriculum/map` · **MERGE → level builder tab (P1, Med)** — keep the visual map + provenance label; drop the duplicated health + 4th DONNA panel.
### LEARNING — `/director/curriculum/learning` · **MERGE → level "Player View" tab (P2, Low)**.
### ACADEMY-VERSION — `/director/curriculum/academy-version` · **DEMOTE (P1, Med)** — admin-console UX (forbidden); keep override history as collapsed provenance, route audit findings into DONNA's brief.
### LEVEL DETAIL — `/director/curriculum/level/[id]` · **KEEP (P2, High anchor)** — "work happens on pages" done right; the destination for all "edit a level" intents.
### LEVEL IMPACT — `/director/curriculum/level/[id]/impact` · **KEEP + wire real data (P0, High)** — the single impact-confirm page; must flow through `proposed_actions` with real impact analysis. Delete the standalone `builder/impact-preview` route.

> **Curriculum group:** 13 pages → 5 (Landing · Builder · Level Detail · Level Impact · Level-Up). The core disease: "is this level complete?" is computed **four separate ways** — one coverage model, surfaced once through DONNA, replaces all four.

### TEMPLATES HUB — `/director/templates` · **SLIM (P1, Med)** — 4 co-equal tiles, no DONNA, links bypass the new tree entirely; lead with one "Build a template" (opens DONNA); drop the cross-domain "Generate Session" tile.
### NEW TREE — `/director/templates/class/*` & `/templates/fitness/*` · **DELETE (P0, High)** — polished, DONNA-shaped, but **demo/mock-backed**; the create wizards persist only to `template_review_requests` (no usable template) and are orphaned from the sidebar. Harvest the DONNA gap-sidebar + coach-preview, then remove.
### LEGACY TREE — `/director/class-templates/*` & `/fitness/templates/*` · **KEEP as canonical (P0/P1, High)** — real `create*WithBlocksAction` writes, real steppers, session generation. Harden: hide import provenance (`airtable_id` leaks), de-dupe the tripled CTAs, reduce 10–12-query fan-out, graft on the new tree's DONNA sidebar.
### DONNA-SUGGESTIONS / IMPACT-PREVIEW / COACH-PREVIEW (templates) · **MERGE/KEEP** — fold suggestions + impact into DONNA conversation + an evidence drawer (P2); keep coach-preview as a clean preview surface (P2, Low).
### ASSESSMENT-TEMPLATE — `/director/assessment-template` · **KEEP, reposition under Settings (P2, Low)** — different domain (`assessment_*`); hide migration language; add navigation.

> **Templates group:** 2 trees → 1. **The headline pilot risk:** the most finished-looking creation flow (new-tree wizard) does not produce a usable template, while the flow that does (legacy form) is the least conversational. Unify by having DONNA draft into the real legacy save.

### SESSIONS — list/overview/archive · **MERGE → one list (P1, Med)** — three renderings of the same table with divergent status colors and coach-name fields; one canonical list, `overview` KPIs become a DONNA weekly answer, `archive` becomes a "Completed" filter.
### NEW SESSION — `/director/sessions/new` · **CONVERT (P0, High)** — a 7-field form is the flagship form-filling violation; "schedule Tuesday 4pm Orange Ball with Coach Mike" → DONNA resolves all fields, surfaces the group/roster consequence as a first-class question (not the buried orange footnote), `generateSessionFromTemplateAction` executes. Form survives only as the confirm card.
### SESSION DETAIL — `/director/sessions/[id]` · **SLIM (P1, High)** — 13+ sections; role-bleed (coach-recap *capture* on a director page → move to coach surface); a migration-056 **debug banner** leaking to directors; promote DONNA briefing to the spine; collapse to ~4 groups (Plan · People · Adapt · Recap).
### PRIVATE-LESSONS — `/director/private-lessons` · **RELOCATE under Approvals (P2, Med)** — correct review-queue pattern; wire DONNA-assisted routing + request→session conversion.

> **Sessions group:** not in the sidebar and correctly so — sessions are an *output* of Templates + Coaches + Today, reached via DONNA. One canonical list + one slimmed detail; creation is DONNA-owned.

### COACHES DIRECTORY — `/director/coaches` · **SLIM (P1, High)** — the real coach-support intelligence (`CoachSupportNeededDashboard`, `donnaCoachIntelligenceAction`) is **built and unused**, while the page reimplements a weaker inline brief; lead with the ranked support verdict, demote the roster to evidence, one "Add coach" primary.
### COACH PROFILE — `/director/coaches/[coachId]` · **KEEP + add DONNA verdict (P2, Med)** — earns its place (real group-assignment mutation), but opens with 3 number tiles and no judgment; source the summary from `fetchCoachIntelligenceAction`, promote assignment to a labelled primary.
### PARENTS — `/director/parents` · **DELETE (P0, High)** — cannot perform its own headline action (approvals live in `/director/review`), duplicates the queue, carries a demo/live data fork, and is a "Center" for a delivery pipeline that isn't live; its own "Ask DONNA" chips prove the intent is conversational. Dissolve: comms questions → DONNA, approvals → the one queue, `AddGuardianForm` → the player profile.

### APPROVALS — `/director/review` · **SLIM to answer-first (P0, High)** — the constitutional heart, but Evidence-First not Answer-First: ~20 bespoke verbose card types, no per-item DONNA recommendation, a two-step Approve/Apply model the director must hold in their head, 8 duplicate clarification blocks in "Done." The better card (`DirectorApprovalActionFlow`) exists and is **unused.** One universal card = DONNA headline + recommended decision + "What changes / What stays" (collapsed) + one "Approve & Apply" + overflow. DONNA pre-sorts so "approve all routine" becomes a batch gesture.
### REVIEW DETAIL — `/director/review/[actionId]` · **KEEP as the pattern (P1, Med)** — already pairs decision + DONNA context + approval preview + audit trail; propagate this shape up into the list cards.
### AI-SUGGESTIONS — `/director/ai-suggestions` · **MERGE → Approvals (P0, High)** — a **constitutionally divergent parallel approval queue** (`academy_suggestions` table, Accept/Defer/Deny verbs) that violates "every mutation through `proposed_actions`" and splits DONNA's intelligence across two inboxes. Route suggestions into Approvals as a section; retire the verb set.
### ALERTS — `/director/alerts` · **DELETE → attention (P0, High)** — zero DONNA, zero decision capability, pure link index duplicating `attention`.
### ATTENTION — `/director/attention` · **KEEP as the consolidation target (P1, High)** — the best-formed surface (real answer-first brief + per-item rationale + priority scoring); make it the single attention front door, absorb alerts' health signals, allow inline quick-decide for `proposed_actions`-backed items.

> **Decision-loop group:** 4 surfaces → 2 — **attention to *notice*** (one DONNA-owned ranked stream), **Approvals to *decide*** (one answer-first `proposed_actions` queue), one vocabulary (Approve / Hold / Dismiss). This directly retires the realized review-queue-overload risk.

### SETTINGS — `/director/settings` · **KEEP (P2, Low)** — the one legitimately form-shaped page (timezone/country are machine config); trim the filler banner; ship or remove the stubbed logo upload; DONNA owns *reaching* it.
### SETUP — `/director/setup` · **DELETE/alias (P2, Low)** — bare redirect to onboarding; pick one noun.
### ONBOARDING — `/director/onboarding/*` · **CONVERGE to one voice interview (P0–P1, High)** — **three parallel onboarding systems** (DNA wizard `OnboardingShell`, voice interview `DirectorInterviewAssistant`, 7-step form journey) ask overlapping questions; the approval model is captured **four times** and coach style **three times**. Five of seven steps *admit they change nothing real yet* — pure preference capture DONNA should own. The landing mis-routes to the duplicate DNA wizard; `players-placement` contradicts the locked "Placement Engine is the onboarding entry point."
  - **Spine:** make `DirectorInterviewAssistant` *the* onboarding (promote it out of "Step 2"); extend `INTERVIEW_STEPS` to absorb level-gates, programs-groups, coaches-permissions, and placement *preferences* as spoken modules with confirm cards.
  - **Stay as pages (DONNA pre-seeds, page confirms):** Curriculum (the real builder, pre-filled) and the Placement *step* (links to the actual Placement Engine).
  - **Delete/demote:** the DNA wizard; the four preference forms as required steps.

### ORPHAN / UTILITY ROUTES
- **DELETE now:** `/director/kpi` (redirect), `/director/setup` (redirect), `/director/donna-coo-demo` (hardcoded seed, redundant).
- **GATE behind dev-flag:** `/director/migration-verify`, `/director/pilot-readiness`, `/director/support-diagnostics`, `/director/donna-analytics` (internal product telemetry living in `/director/*` — a scope/trust leak).
- **KEEP (reposition):** `/director/command-center` (DONNA command entry), `/director/demo` (labelled pilot tour), `/director/level-up` (player-movement review; belongs to the Players domain), `/director/improvement` (add a DONNA brief; consider merging with level-up into "Player Development").

### THE DONNA LAYER (cross-cutting) · **CONVERGE (P0, High)**
- **Inventory:** ~186 components (`components/donna/` 85, `components/assistant/` 101); the widget `DonnaAssistantButton.tsx` is **6,252 lines** importing ~60 modules. ~10 Director-facing DONNA entry points where 3–4 should exist. `DonnaSimplifiedPageHeader` and `TemplatesDonnaPanel` are dead duplicates; 5 page-grade `*Dashboard` components are misfiled under `assistant/`.
- **Fragmentation:** **3 independent conversation backends** (`donnaGlobalCommandAction`, the orchestrator path, `donnaLiveConversationAction`/`donnaStrategicConversationAction`) with **no shared history** — ask in the widget, open the page, the thread is gone. Two different components are both named `DonnaCommandBar`.
- **Containment breach:** **33 accepted** sidebar violations — `finalizeStaleSessionAction`, ~14 `save*DraftAction`s, `saveWorkflowStateAction` (multi-step), and editors in `GenericDraftPanel`/`TemplateDraftPanel`/`DonnaMessageReviewPanel`/`DonnaReviewQueuePanel`. ~13 workflows can be *completed* inside the chat — the §0 law is broken.
- **Answer-first:** the *cards* are correct (`DonnaResponseCard`, evidence-on-demand toggle); the *surface around them* dumps draft editors and review panels.
- **Redesign:** (1) one conversation backend + one persisted thread shared by widget and page; (2) the widget is canonical, the full page renders the same thread expanded, chips/briefs/inline-prompts only *open/seed* it; (3) answer-first as the only renderer; (4) drive the 33→0 ratchet — every editor/`save*`/`finalize*`/`route*` moves to its owning page, widget keeps read-only preview + "Open workspace →"; (5) decompose the 6,252-line widget, relocate the 5 dashboards, delete dead code. **Target ~20–30 DONNA components, not 186.**

---

## 5. Top 25 highest-impact improvements

Ranked by leverage (reach × philosophy-fit × executive-felt impact), not effort.

1. **Converge DONNA to one conversation backend + one persistent thread** across widget, page, and voice. *(D3 — the central law.)*
2. **Drive the 33→0 sidebar-containment ratchet**: move every editor/`save*`/`finalize*`/`route*` action out of the widget to its owning page. *(D3)*
3. **Make Approvals answer-first**: one universal card (DONNA recommendation + What-changes/What-stays + one Approve & Apply), adopting the unused `DirectorApprovalActionFlow`. *(Constitutional heart.)*
4. **Merge `ai-suggestions` into `proposed_actions`** and retire the Accept/Defer/Deny verb set. *(Kills a parallel constitutional queue.)*
5. **Collapse Dashboard into Today**; remove it from the sidebar; delete the charts-as-navigation table + ~877 lines of orphaned wall components.
6. **Rebuild Today as one conversational brief** with an inline `proposed_actions` action; delete the 4 charts, the fabricated timeline, and the 6 orphan components.
7. **Slim the Player Profile** from 9 tabs / 4 KPI surfaces / 30+ queries to one answer block + 4 tabs + one evidence drawer.
8. **Unify the two Templates trees** — DONNA drafts into the real legacy `create*WithBlocksAction`; delete the demo new tree that produces no usable template.
9. **Delete the 3 fake curriculum scaffolds** (`add-drill`, `add-fitness`, `impact-preview`) — a trust-guardrail fix, not just cleanup.
10. **Converge onboarding to the one voice interview**; make the landing route to it; demote the DNA wizard and the four preference forms.
11. **Make session creation DONNA-owned** ("schedule Tuesday 4pm Orange Ball with Coach Mike"); demote the 7-field form to a confirm card.
12. **Collapse alerts + attention into one DONNA attention stream**; delete `alerts`.
13. **Unify onboard-stepper + Placement Engine** into one DONNA-led activation queue; reconcile the `academy_levels`/`curriculum_levels` split-brain.
14. **Delete the 477-line curriculum guided wizard**; replace with a DONNA "walk me through what's incomplete" prompt.
15. **Wire the curriculum impact page to real data + `proposed_actions`**; delete the standalone duplicate impact route.
16. **Dissolve the Parents page**; route comms to DONNA, approvals to the one queue, guardians to the profile.
17. **Lead Coaches with the built-but-unused support intelligence**; demote the roster to evidence.
18. **One coverage model for curriculum** — replace the four parallel "is this level complete?" implementations.
19. **Slim Session Detail** to ~4 groups; remove the debug banner; move coach-recap capture to the coach surface.
20. **Collapse the three session-list renderings** (list/overview/archive) into one canonical list reached via DONNA.
21. **Players Directory + Profile become the pattern**: counts as prose, one DONNA header, absorb `active` and `onboarding-review`.
22. **Gate the 4 internal tools** (`migration-verify`, `pilot-readiness`, `support-diagnostics`, `donna-analytics`) behind a dev flag; remove from the director portal.
23. **Delete the redirect/demo stubs** (`kpi`, `setup`, `donna-coo-demo`).
24. **Demote curriculum `academy-version`** from admin console to collapsed provenance + DONNA-narrated audit findings.
25. **Decompose the 6,252-line widget** and delete dead DONNA components (`DonnaSimplifiedPageHeader`, `TemplatesDonnaPanel`), relocating the 5 misfiled dashboards. *(Target ~20–30 components.)*

---

## 6. Implementation roadmap (ordered by impact)

Each phase is independently shippable and re-scored on completion. **Within every phase, do the deletions first** — they remove the surfaces that later work would otherwise have to maintain.

### Phase 0 — Trust & truth (fastest, highest trust-per-effort)
Remove anything fake or leaking before anything else. *Top-25: #9, #23, #22, parts of #6/#5/#8.*
- Delete the 3 fake curriculum scaffolds and the curriculum guided wizard.
- Delete redirect/demo stubs (`kpi`, `setup`, `donna-coo-demo`); gate the 4 internal tools.
- Delete dead components (Today's 6 orphans, Dashboard's 3 wall components, `DonnaSimplifiedPageHeader`, `TemplatesDonnaPanel`).
- Strip leaks: the session-detail debug banner, template import provenance, assessment migration language, the donna-analytics director route.
- **Exit:** no fake surface renders as live; Cognitive Load +, Simplicity +.

### Phase 1 — The decision spine (the constitutional heart)
Make the place Directors actually decide answer-first and singular. *Top-25: #3, #4, #12, #16.*
- One answer-first Approvals card (adopt `DirectorApprovalActionFlow`); one verb set.
- Merge `ai-suggestions` → `proposed_actions`; delete `alerts` → attention.
- One DONNA attention stream as the notice front door.
- **Exit:** 4 decision surfaces → 2; review-queue-overload retired. Re-score Conversation Ownership + Executive Experience.

### Phase 2 — One DONNA
Converge the assistant itself. *Top-25: #1, #2, #25.*
- One conversation backend + one persistent thread; widget canonical, page = same thread expanded.
- Drive 33→0 containment; decompose the 6,252-line widget; relocate dashboards; delete dead code.
- **Exit:** `ExecutiveWorkspaceCertification` path to green; DONNA Integration ↑↑.

### Phase 3 — Conversation-first workflows
Invert the form-first front doors using engines that already exist. *Top-25: #6, #7, #8, #10, #11, #13, #14, #15, #17, #19, #20, #21.*
- Today as one conversational brief with inline action.
- Player Profile slimmed; Players absorbs `active`/`onboarding-review`.
- Templates trees unified; session creation DONNA-owned; session lists collapsed; session detail slimmed.
- Onboarding converged to the voice interview; onboard+Placement unified; curriculum impact wired to real data; one curriculum coverage model.
- Coaches led by support intelligence.
- **Exit:** the 7-destination IA realized; composite target ≥ 75.

### Phase 4 — Polish & permanence
- Dissolve Parents; relocate private-lessons under Approvals; reposition assessment-template under Settings; demote curriculum `academy-version`; merge `improvement` + `level-up` into "Player Development."
- Settings cleanup; ship or remove the logo-upload stub.
- **Exit:** ratify this document's IA as the locked standard; wire its checks into the Guardian framework.

---

## 7. How to use this document

This is the **standard against which all future UI and workflow changes are evaluated.** Before any Director-surface sprint:

1. **Does it add a surface?** Default to no. A new route must justify itself against the 7-destination IA; a new DONNA component against the ~20–30 target.
2. **Does it own a verb on a page, or a noun in DONNA?** If a workflow's front door is a form, or a unit of work completes inside the chat, it violates Law 2.
3. **Does it lead with the answer?** A page that opens with data, a table, or a chart before a DONNA recommendation violates Laws 3–4.
4. **Is anything fake?** A control that flips local state, a draft that never persists, demo data on a live surface — all violate Law 6.
5. **Does every mutation flow through `proposed_actions` with one vocabulary?** A second queue or verb set violates Law 7.

When a change is unclear, return to §0. The scores in §3 are the baseline; every shipped phase must move them up, never down.
