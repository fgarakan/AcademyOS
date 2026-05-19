# DONNA Onboarding — Prototype and Current Flow Audit

**Date:** 2026-05-19
**Sprint:** O-1

---

## 1. Prototype Screen-by-Screen IA Extraction

Stack: React + Vite standalone app. Teal accent (#00C9A7). All inline styles. Inter font. External CDN image URLs.

### Screen 1 — Welcome
- Full-screen hero with external background image (CDN URL, 12% opacity)
- Radial teal ambient glow overlay
- DONNA introduction: "Meet DONNA — Your AI Academy Assist"
- Subtitle: DONNA learns how your academy thinks, coaches, and communicates
- 5-step progress strip (Academy Basics → Coaching DNA → Session Defaults → Player Priorities → Review and Activate)
- CTAs: "Start with DONNA" (goes to academy-basics) / "Use recommended defaults" (skips to dna-summary)
- Feature cards strip: Curriculum Builder, Player Pathways, Academy Analytics, Parent Reports
- DONNA panel on right showing intro message

### Screen 2 — Academy Basics (Step 1 of 5)
- Academy name text input
- Age group pills: Red Ball (5-8), Orange Ball (8-10), Green Ball (9-11), Yellow Ball (10+), High Performance (Elite juniors), Adult
- Academy model cards (6 options): Development, High Performance, Recreational+Competitive, Multi-Site, Private Coaching, School/Club
- Live DONNA confirmation: "I'll use this to customise your curriculum levels, templates, and coach views."
- Back + Continue navigation

### Screen 3 — Coaching Philosophy (Step 2 of 5 — Coaching DNA)
- Select up to 3 coaching styles from 8 cards with emoji icons
- Styles: Fundamentals First, Game-Based Learning, High-Performance Discipline, Player-Centered Coaching, Tactical First, Movement First, Competition-Ready, Joy + Retention
- Selection counter (0/3)
- Each card shows icon, label, description
- Rank badges (1, 2, 3) on selected cards
- DONNA live summary shows selected labels

### Screen 4 — Coach Communication (Step 3 of 5)
- Primary + secondary communication style selection
- 6 styles: Direct+Clear, Encouraging+Positive, Question-Led, High-Energy Motivator, Calm+Precise, Standards-Based
- Two-button UI on each card: "Primary" / "Secondary"
- Live Primary / Secondary indicators at top
- DONNA summary: "I'll use this to shape coach notes, session cues, player feedback, and parent-safe language."

### Screen 5 — Session Design (Step 4 of 5)
- Toggle session building blocks from 7 options
- Each shows icon, label, desc, duration in minutes
- Fixed warm-up (10 min) and reflection (5 min) blocks always included
- Live session timeline preview — proportional block bars with durations
- Total session duration counter
- DONNA summary lists selected blocks in order

### Screen 6 — Player Development (Step 5 of 5)
- Select up to 5 priorities from 10 options
- Left panel: pill selectors with rank numbers
- Right panel: ranked drag-and-drop stack with grip handles and remove buttons
- DONNA summary: "These priorities will influence level requirements, player dashboards, coach watch-fors, and parent updates."

### Screen 7 — Parent Communication (not in step counter, appears between Player Development and DNA Summary)
- Select all applicable parent communication styles from 7 options
- Styles: Simple+Reassuring, Progress-Focused, Developmental Education, Actionable At-Home Support, Minimal Parent Noise, Transparent Level Progression, Tournament Support Guidance
- DONNA summary: "I'll apply X communication styles to all parent-facing messages..."
- NOTE: This screen says "I'll apply" which implies immediate mutation — this is a safety risk.

### Screen 8 — DNA Summary (Review)
- Left column: DNA card (300px) with external background image, narrative summary, 4 stat boxes, model badge
- Right column: section rows for all selections with colored pills
- "What DONNA will build" description card
- CTAs: "Approve Academy DNA" → goes to final, "Edit Selections" → back to coaching-philosophy, "Adjust with DONNA" → donna-chat
- NOTE: "Approve Academy DNA" language implies real mutation — safety risk.

### Screen 9 — DONNA Chat (Adjustment Flow)
- Chat interface with DONNA avatar (external CDN URL)
- 5 example prompt chips
- DONNA proposes changes with title, changes list, affected areas
- User can Approve / Edit / Cancel proposals
- "Changes approved. Updating your DNA..." — SAFETY RISK: implies real mutation
- Approve button calls goTo('dna-summary') only — no actual DB write

### Screen 10 — Final Activation
- Success header with CheckCircle icon
- DONNA message: "I've created your coaching DNA. Next I can help you set up..."
- DNA summary pills (coaching styles, session designs, player priorities)
- 6 next step cards: Build Curriculum, Create Templates, Add Coaches, Add Players, Parent Communication Rules, Preview Director Dashboard
- All next step buttons show `toast.success('Feature coming soon...')` — FAKE APPLIED LANGUAGE
- Primary CTAs: "Continue Setup" (also toast only) / "Go to Director Dashboard" (also toast)
- RISK: Every action is a fake toast. No real routes linked.

---

## 2. Current AcademyOS Onboarding — Route and Component Inventory

### Routes
| Route | File | Description |
|---|---|---|
| `/director/onboarding` | `src/app/director/onboarding/page.tsx` | Main checklist hub — 12-step task list |
| `/director/onboarding/interview` | `src/app/director/onboarding/interview/page.tsx` | Director Interview setup assistant |
| `/director/onboarding/curriculum` | `src/app/director/onboarding/curriculum/page.tsx` | Curriculum starter form |
| `/director/onboarding/level-gates` | `src/app/director/onboarding/level-gates/page.tsx` | Level gates configuration |
| `/director/onboarding/programs-groups` | `src/app/director/onboarding/programs-groups/page.tsx` | Programs and groups setup |
| `/director/onboarding/coaches-permissions` | `src/app/director/onboarding/coaches-permissions/page.tsx` | Coach roles and permissions |
| `/director/onboarding/players-placement` | `src/app/director/onboarding/players-placement/page.tsx` | Player import and placement |
| `/director/players/onboarding-review` | `src/app/director/players/onboarding-review/page.tsx` | Player onboarding review |
| `/dev/onboarding-preview` | `src/app/dev/onboarding-preview/page.tsx` | Dev preview for decks |

### Components
| Component | File | Description |
|---|---|---|
| `AOSDeck` | `src/components/onboarding/AOSDeck.tsx` | Animated slide deck for role intro |
| `decks.ts` | `src/components/onboarding/decks.ts` | Deck data with SVG illustrations |
| `FirstRunDeckGate` | `src/components/onboarding/FirstRunDeckGate.tsx` | Gates users through first-run deck |
| `AnimatedOnboardingDeck` | `src/app/director/onboarding/AnimatedOnboardingDeck.tsx` | Wrapper for animated deck in onboarding |
| `SetupProgressChecklist` | `src/components/onboarding/SetupProgressChecklist.tsx` | Progress checklist component |
| `GuidedStepCard` | `src/components/onboarding/GuidedStepCard.tsx` | Individual step card UI |
| `NextBestActionCard` | `src/components/onboarding/NextBestActionCard.tsx` | Next best action CTA |
| `PageExplainerCard` | `src/components/onboarding/PageExplainerCard.tsx` | Contextual explainer |
| `ClassTemplateSetupGuide` | `src/components/onboarding/ClassTemplateSetupGuide.tsx` | Class template setup guidance |
| `CurriculumLoopDiagram` | `src/components/onboarding/CurriculumLoopDiagram.tsx` | Curriculum flow diagram |

### Current flow summary
The current onboarding at `/director/onboarding` is a **12-step task list** embedded within the standard director sidebar layout. Steps 1–7 are active with real DB writes. Steps 8–12 are in a collapsed "Advanced setup — later" section with no functionality. The AnimatedOnboardingDeck (role introduction slides) appears at the top as an optional carousel. There is no DONNA presence, no progressive DNA building, and no "tell us about your academy" first-run experience.

---

## 3. Prototype UI and Flow Rating

**Visual quality:** 8/10 — Dark premium aesthetic, good motion, session timeline is impressive, pill selectors are clean. Teal palette is cohesive but wrong for AcademyOS.

**Flow clarity:** 7/10 — Steps 1–5 are clear. The split between "Coaching Philosophy" and "Coach Communication" as two separate screens adds unnecessary friction. Player Development drag-and-drop is clever but complex for onboarding. Parent Communication appears without a step number, creating confusion.

**DONNA panel:** 8/10 — Right panel with live DNA preview is the strongest idea in the prototype. Progress steps, live building animation, and principle quote are excellent. External avatar/CDN URLs are a dependency risk.

**Safety/trust:** 4/10 — Multiple fake applied language issues:
- ParentCommunicationScreen: "I'll apply X styles to all parent-facing messages" (implies mutation)
- DNASummaryScreen: "Approve Academy DNA" (implies real activation)
- DonnaChatScreen: "Changes approved. Updating your DNA..." (implies real mutation)
- FinalActivationScreen: ALL actions are fake toasts ("Feature coming soon")

**Technical implementation:** 3/10 — Standalone Vite/React app, all inline styles, external CDN URLs. None of this can be used in AcademyOS. Prototype code must not be copied.

**Overall prototype rating: 6.5/10** — Strong IA and visual concept; unsafe language; wrong stack; wrong palette.

---

## 4. Current AcademyOS Onboarding UI and Flow Rating

**Visual quality:** 6/10 — Clean dark design, correct lime palette, proper AcademyOS components. But feels like an admin checklist, not a product onboarding experience.

**Flow clarity:** 5/10 — A 12-step task list is hard to start. No momentum, no progressive revelation, no emotional hook. "Academy OS will guide you one step at a time" is vague. The AnimatedOnboardingDeck is good but disconnected from the setup steps.

**DONNA presence:** 1/10 — DONNA is completely absent from the onboarding flow. Steps 2 ("Academy Setup Assistant") link to an interview but this is buried.

**Safety/trust:** 9/10 — No fake applied language. Real DB writes only where setup actually saves. Correct use of proposed_actions pipeline.

**Director experience:** 4/10 — A first-time director lands on a 12-step checklist with no excitement, no "tell us about your academy" hook, no AI momentum. This will feel like admin software, not a premium operating system.

**Overall current rating: 5/10** — Structurally sound, functionally correct, experientially flat.

---

## 5. Keep / Replace / Delete Table

| Element | Decision | Reason |
|---|---|---|
| AcademyOS dark/lime design tokens | Keep | Core identity, correct palette |
| Existing `Card`, `CardContent`, button components | Keep | Correct and polished |
| Real DB writes in current onboarding steps | Keep | Correct and safe |
| `FirstRunDeckGate` / `AOSDeck` role intro | Keep | Good conceptual pattern |
| Current director sidebar layout for onboarding | Replace | Onboarding needs full-screen focus, not sidebar |
| Current 12-step flat checklist as entry point | Replace | Replace with progressive 7-step DONNA flow |
| Prototype teal (#00C9A7) color scheme | Do not copy | Use lime (#C8FF00) |
| Prototype inline styles | Do not copy | Use Tailwind classes |
| Prototype external CDN avatar/hero images | Do not copy | No external image dependencies |
| Prototype standalone Vite/React routing | Do not copy | Use Next.js App Router |
| Prototype UI kit components | Do not copy | Use AcademyOS component library |
| Prototype pill selector IA (age groups, coaching styles) | Extract as IA reference only | Re-implement natively |
| Prototype live DNA panel concept | Extract as IA reference only | Re-implement natively with lime palette |
| Prototype session timeline preview | Extract as IA reference only | Re-implement natively |
| Prototype fake applied language | Delete | Safety violation |
| Prototype fake toast next steps | Delete | Trust violation |
| Prototype "I'll apply X styles to all messages" | Delete | Implies mutation that hasn't happened |
| Prototype "Changes approved. Updating DNA..." | Delete | False mutation claim |
| Prototype external CDN background/avatar URLs | Delete | Not usable in production |

---

## 6. What Must Be Rebuilt Natively

1. Full-screen onboarding shell (no director sidebar) — new route at `/director/onboarding` or `/onboarding`
2. 7-step progress rail using AcademyOS design tokens
3. Persistent DONNA panel (right, desktop) using AcademyOS Card components and lime accent
4. Pill/card selectors for academy basics, coaching DNA, session design, parent/player experience
5. Live Academy DNA preview in DONNA panel (building up as user selects)
6. Academy DNA review step with section summary and edit links
7. DONNA adjustment draft flow — fully safe, draft-only, no DB writes
8. Activation checklist with real route links where available
9. Save/resume via localStorage (no backend writes)
10. Step context provided via React context (OnboardingContext pattern)

---

## 7. What Must Not Be Copied

- Any file from `prototype-reference/academyos-donna-onboarding/`
- `client/src/index.css` — prototype CSS system
- `client/src/components/ui/*` — prototype UI kit
- `components.json`, `package.json`, `vite.config.ts`, `pnpm-lock.yaml` — prototype build system
- `client/src/contexts/ThemeContext.tsx` — prototype theme system
- `client/src/components/OnboardingLayout.tsx` — prototype layout (use AcademyOS pattern)
- `client/src/contexts/OnboardingContext.tsx` — prototype context (re-implement)
- External image URLs from prototype (CDN avatar, hero background, DNA card background)
- Any inline style objects from prototype screens

---

## 8. Current Build and Runtime Risks

| Risk | Status | Action |
|---|---|---|
| Platform server action runtime error | Fixed in commit 14831ce | Verify at `/platform` before continuing |
| globals.css invalid Tailwind classes | Fixed in commit 6530b54 | Already clean per git log |
| Current `/director/onboarding` route still active | Active | New DONNA onboarding will replace or extend this route |
| No `/onboarding` root-level route exists | Known gap | Sprint O-3 will address |
| TypeScript clean | Verified clean (npx tsc --noEmit produced no output) | Maintain through all sprints |

---

## 9. Recommended Final 7-Step IA

### Flow: DONNA Onboarding — 7 Steps

```
Step 1 — Welcome / Setup Mode
  Entry point. DONNA introduction. Setup mode selector.
  Modes: Fast Start (5 min), Guided Setup (15 min), Full Setup (30-45 min),
         Import Existing Academy, Consultant Setup, Multi-Location Academy

Step 2 — Academy Basics
  Academy name, locations, academy model (6 options),
  age groups (ball levels), primary goals, program type.

Step 3 — Coaching DNA
  Combines prototype Coaching Philosophy + Coach Communication.
  Coaching style pills (up to 3) with labels, explanations, and downstream impact.
  Communication style (primary + secondary).
  Live preview: coach language style, DONNA coach prompt style, session tone.

Step 4 — Session + Curriculum Defaults
  Combines prototype Session Design + Player Development.
  Session block selectors with live timeline preview.
  Development priority pills (ranked up to 5).
  Shows: suggested template structure, skill path, competition path, fitness path.

Step 5 — Parent + Player Experience
  Parent communication style (multi-select) + parent visibility rules (toggles).
  Player mission style selector.
  Shows: parent portal tone preview, player portal mission tone, DONNA boundaries.

Step 6 — Review Academy DNA
  Full summary of all selections by section with edit links.
  DONNA narrative summary card.
  Activation readiness signal.
  Draft-only language throughout.

Step 7 — Activation Checklist
  Operational launch checklist with real route links where routes exist.
  Items: curriculum spine, class templates, add coaches, import players,
         assign groups, preview parent portal, preview player portal,
         start coach wrap-up.
  Each item shows status, explanation, and DONNA recommended next step.
```

### Key design decisions
- Replaces the 10-screen prototype with 7 cleaner, consolidated steps
- Coaching Philosophy + Coach Communication merged into one "Coaching DNA" step — reduces friction
- Session Design + Player Development merged into one "Session + Curriculum Defaults" step — more operational
- DNA Summary renamed "Review Academy DNA" — clearer intent
- DONNA Chat replaced by persistent "DONNA adjustment draft panel" available at every step
- Final Activation replaced by operational checklist with real links
- All DONNA copy uses draft/prepare/suggest language — never "applied" or "updated" unless persisted

### Layout pattern
- Desktop: Full-screen shell, main content area (flex-1), DONNA panel (320px right, fixed)
- Mobile: Single column, DONNA panel collapses to expandable section below content
- No director sidebar during onboarding
- Progress rail visible above content area (lime accent, 7 steps)

---

## 10. Prototype Reference Status

- Zip verified: `prototype-reference/academyos-donna-onboarding.zip` (231 KB, valid)
- Extracted to `/tmp` for inspection only — cleaned after audit
- Zip is NOT staged in git
- No prototype code, CSS, fonts, package files, App/Layout files, or routing will be copied
