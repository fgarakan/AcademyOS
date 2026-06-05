# DONNA Surface Inventory V1

**Date:** 2026-06-05
**Sprint:** Mega Sprint 2196–2215 — DONNA Surface Unification V1
**Purpose:** Classify every DONNA surface in AcademyOS as KEEP, MERGE, REMOVE, or REPLACE.
**Method:** Code audit of all TSX files referencing DONNA across `src/app/` and `src/components/`.

---

## Audit Summary

| Category | Count |
|---|---|
| Layout-level overlays | 6 |
| Page-level briefs | 6 |
| Inline command sections | 3 |
| Curriculum builder surfaces | 8 |
| Coach surfaces | 5 |
| Player / Parent surfaces | 4 |
| Component library | 80+ |
| **Total identified surfaces** | **110+** |

**Core problem:** DONNA was built incrementally across 2000+ sprints. Each sprint added a new component to solve a specific problem. The result is 110+ surfaces that collectively create a fragmented, inconsistent DONNA experience. A director encounters up to 5 concurrent DONNA presences on a single page.

---

## Layer 1 — Director Layout (mounted on every director route)

These surfaces appear on every page inside `src/app/director/layout.tsx`.

| Surface | Component | Location | Classification | Rationale |
|---|---|---|---|---|
| Floating DONNA shell | `DonnaAssistantButton` | Bottom-right, persistent | **KEEP** | This IS the canonical DONNA. 5551-line intelligence shell with voice, memory, multi-turn conversation, draft creation, approval workflows. The one true DONNA entry point. |
| "Hey DONNA" wake word | `DonnaWakeWordLayer` | Global listener | **KEEP** | The canonical voice activation. "Hey DONNA" is the single wake phrase. Activates the floating shell. |
| Guided highlight overlay | `DonnaHighlightBanner` | Fixed overlay | **KEEP** | DONNA's ability to highlight specific UI zones. Used by the shell to direct director attention. Not a duplicate — it's a shell feature. |
| Session context provider | `DonnaSessionContextProvider` | React context | **KEEP** | Foundational shared memory layer. All DONNA surfaces depend on this. Not a visible surface. |
| COO status bar | `DonnaCOOStatusWrapper` | Top of content area, every page | **REMOVE** | Duplicates information already in the sidebar (pending count badge) and the homepage DONNA brief. Creates a competing "DONNA presence" above every page. Adds visual noise without adding intelligence. Dismissed frequently by users. |
| Once-per-day brief banner | `DonnaDailyCOOBriefSurface` | Below status bar, dismissible | **REMOVE** | Duplicates `DirectorTodayDonnaBrief` on the `/director` homepage. Shows a brief that the director already sees when they log in. The once-per-day gate means it fires at random — on a curriculum page, a review page, anywhere. Jarring. |
| Per-route proactive guide card | `DonnaProactiveBriefCard` | Fixed, bottom-right area | **REMOVE** | Appears alongside the floating DONNA button, creating "which DONNA do I use?" confusion. The floating shell already handles onboarding questions. Two DONNA surfaces competing for the same bottom-right space erodes trust in both. |

---

## Layer 2 — Director Homepage (`/director`)

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| DONNA Daily Brief | `DirectorTodayDonnaBrief` | **KEEP** | The canonical page-level brief for the homepage. 2 sentences, 1 CTA. Implements the brief standard. Source of truth for daily intelligence. |
| DONNA Dashboard Open Card | `DonnaDashboardOpenCard` | **KEEP** | CTA that opens the DONNA shell with a suggested question. Not a duplicate — it dispatches `donna:open`. Single CTA. |
| DONNA Executive Card | `DonnaExecutiveCard` | **KEEP** | Structured priority list from the attention engine. Director's highest-leverage actions. Evidence-based, not duplicated elsewhere. |

---

## Layer 3 — Director Today Page (`/director/today`)

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| DONNA Priority Brief | `DonnaTodayBriefPanel` | **KEEP** | Page-level brief. Single intelligence surface for the Today route. |
| Multiple suggestion chips | `TodayDonnaSuggestionChip` (5–6 chips) | **MERGE** | Chips are useful CTAs that pre-fill the DONNA shell. However, 5–6 chips on one page violates the "one CTA" brief standard. Reduce to max 2–3 contextual chips, or move into the DONNA shell's suggested questions. |

---

## Layer 4 — Director Curriculum Page (`/director/curriculum`)

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| DONNA Curriculum Brief | `DonnaCurriculumBrief` | **KEEP** | Page-level brief. Single intelligence surface for the Curriculum route. |
| DONNA Curriculum Context Panel | `DonnaCurriculumContextPanel` | **KEEP** | Shown only when `?improve=` URL parameter is active. Not a persistent duplicate — it's a focused improvement workflow surface. |
| DONNA Curriculum Registrar | `CurriculumDonnaRegistrar` | **KEEP** | Registers page context into `DonnaSessionContext`. Not a visible surface — it's a data registration hook. |

---

## Layer 5 — Director Review Page (`/director/review`)

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| DONNA Review Brief Panel | `DonnaReviewBriefPanel` | **KEEP** | Page-level brief. Single intelligence surface for the Review route. |
| DONNA Review Tab Guide | `DonnaReviewTabGuide` | **KEEP** | Tab-contextual hint showing what DONNA knows about the active tab's items. Not a global duplicate — it's tab-specific context. |
| DONNA Command Section | `DonnaCommandSection` | **REMOVE** | Inline text input bar (`DonnaCommandBar` + `DonnaSuggestedQuestions`). Duplicates the floating `DonnaAssistantButton`. Creates a second "talk to DONNA" entry point on the same page. Violates "one DONNA" principle. |

---

## Layer 6 — Director Players List (`/director/players`)

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| DONNA Screen Brief Static | `DonnaScreenBriefStatic` | **KEEP** | Page-level brief for the players directory. Communicates DONNA's read on the player population. |
| DONNA Players Presence CTA | `DonnaPlayersPresenceCTA` | **KEEP** | Contextual CTA shown only when actionable signals exist. Single entry point that opens the DONNA shell. |
| DONNA Command Section | `DonnaCommandSection` | **REMOVE** | Same as review page — inline text bar that duplicates the floating shell. Two command surfaces on one page. |

---

## Layer 7 — Director Player Profile (`/director/players/[playerId]`)

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| Player Profile DONNA Registrar | `PlayerProfileDonnaRegistrar` | **KEEP** | Registers player context into session. Not a visible surface. |
| Collapsed Evidence Section | `CollapsedDetailSection label="DONNA Evidence Summary"` | **KEEP** | Collapsible evidence panel. Single focused surface. |
| DONNA Command Section | `DonnaCommandSection` | **REMOVE** | Inline text bar. Player profile already has `PlayerProfileDonnaRegistrar` providing context to the floating shell. Inline command section creates a second command entry point. |

---

## Layer 8 — Director DONNA Dedicated Pages

| Surface | Route | Classification | Rationale |
|---|---|---|---|
| DONNA Director Shell | `/director/donna` | **KEEP** | Full dedicated DONNA conversation page. `DonnaVoiceReadyShell`. The deepest DONNA experience. |
| DONNA Learning | `/director/donna/learning` | **KEEP** | Curriculum learning preview via DONNA. Dedicated use case. |
| DONNA Analytics | `/director/donna-analytics` | **KEEP** | DONNA analytics dashboard. Dedicated diagnostic route. |
| DONNA COO Demo | `/director/donna-coo-demo` | **KEEP** | Demo-only route. Not shown in production nav. |

---

## Layer 9 — Curriculum Builder (`/director/curriculum/builder`)

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| Curriculum DONNA Panel | `CurriculumDonnaPanel` | **KEEP** | The primary DONNA interface within the builder. Builder is a focused workflow with its own DONNA context. |
| DONNA Add Drill Draft | `DonnaAddDrillDraft` | **KEEP** | Specific builder action. Scoped to builder workflow. |
| DONNA Add Fitness Draft | `DonnaAddFitnessExerciseDraft` | **KEEP** | Specific builder action. Scoped to builder workflow. |
| DONNA Add Assessment Gate | `DonnaAddAssessmentGateDraft` | **KEEP** | Specific builder action. Scoped to builder workflow. |
| DONNA Add Player Mission | `DonnaAddPlayerMissionDraft` | **KEEP** | Specific builder action. Scoped to builder workflow. |
| DONNA Rewrite Level Draft | `DonnaRewriteLevelDraft` | **KEEP** | Specific builder action. Scoped to builder workflow. |
| DONNA Conversation Draft Panel | `DonnaConversationDraftPanel` | **KEEP** | Conversation thread within builder. Builder-scoped context. |
| DONNA Safety Disclosure | `DonnaSafetyDisclosure` | **KEEP** | Trust copy shown before AI-generated content. Not a duplicate — it's a guardrail. |

---

## Layer 10 — Coach Portal

| Surface | Component / Route | Classification | Rationale |
|---|---|---|---|
| Coach DONNA Shell | `/coach/donna` | **KEEP** | Dedicated DONNA experience for coaches. Role-scoped intelligence. |
| Coach DONNA Session Panel | `CoachDonnaSessionPanel` | **KEEP** | Session-specific DONNA guidance. Not a duplicate of the director shell. |
| Coach Session Voice Shell | `CoachSessionVoiceShell` | **KEEP** | Voice interface during active session. Coach-specific use case. |
| Coach Submit for Review Flow | `CoachSubmitForReviewFlow` | **KEEP** | DONNA-guided review submission. Workflow-specific. |
| Coach Support Needed Dashboard | `CoachSupportNeededDashboard` | **KEEP** | DONNA surface for coach support signals. Director-facing read on coach needs. |

---

## Layer 11 — Player / Parent Portals

| Surface | Component / Route | Classification | Rationale |
|---|---|---|---|
| Player Ask DONNA | `/player/ask-donna` | **KEEP** | Dedicated Q&A surface for players. Role-scoped. |
| Parent Ask DONNA | `/parent/ask-donna` | **KEEP** | Dedicated Q&A surface for parents. Role-scoped, parent-safe guardrails. |
| Player DONNA Chat | `DonnaChat` | **KEEP** | Player portal chat component. |
| Parent DONNA Chat | `ParentDonnaChat` | **KEEP** | Parent portal chat component. Parent-safe rules applied. |

---

## Layer 12 — Onboarding

| Surface | Component | Classification | Rationale |
|---|---|---|---|
| Onboarding DONNA Panel | `OnboardingDonnaPanel` | **KEEP** | DONNA guidance during academy setup. Onboarding-specific workflow. |
| Director Interview Assistant | `DirectorInterviewAssistant` | **KEEP** | DONNA-powered interview for academy DNA capture. Workflow-specific. |
| DONNA Adjustment Draft Panel | `DonnaAdjustmentDraftPanel` | **KEEP** | DONNA adjusts curriculum draft during onboarding. Workflow-specific. |
| Step Donna Recommendation | `StepDonnaRecommendation` | **KEEP** | Placement recommendation step. Workflow-specific. |

---

## Summary — What Changes This Sprint

| Action | Count | Impact |
|---|---|---|
| **REMOVE from layout** | 3 surfaces | Eliminates 3 competing DONNA presences on every director page |
| **REMOVE from pages** | 3 `DonnaCommandSection` instances | Eliminates duplicate inline text entry on review, players list, player profile |
| **KEEP** | All intelligence, memory, voice, reasoning | Zero intelligence regression |
| **Net reduction** | 6 surfaces eliminated | Director sees 1 DONNA (the floating shell) + 1 page brief per route |
