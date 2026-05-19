# DONNA Onboarding — Information Architecture V1

**Date:** 2026-05-19
**Sprint:** O-2

---

## Core Product Promise

> "Tell DONNA how your academy works. DONNA builds your starting operating system."

---

## Final 7-Step Flow

```
Step 1 — Welcome / Choose Setup Mode
Step 2 — Academy Basics
Step 3 — Coaching DNA
Step 4 — Session + Curriculum Defaults
Step 5 — Parent + Player Experience
Step 6 — Review Academy DNA
Step 7 — Activate Starting System
```

Total estimated time: 5 minutes (Fast Start) to 30–45 minutes (Full Setup).

---

## Step 1 — Welcome / Choose Setup Mode

**Headline:** "Tell DONNA how your academy works."
**Subheadline:** "DONNA builds your starting operating system."

**DONNA intro copy:**
"I'm DONNA — Director of Operations and Neural Network Assistant. I'll learn how your academy thinks, coaches, and communicates. Then I'll prepare your starting operating system."

**Setup mode options:**

| Mode | Label | Time | Description |
|---|---|---|---|
| fast-start | Fast Start | ~5 min | Core identity only. DONNA fills the rest with smart defaults. |
| guided-setup | Guided Setup | ~15 min | Academy basics, coaching DNA, and parent experience. |
| full-setup | Full Setup | ~30–45 min | Every section in detail. Most personalized starting system. |
| import-existing | Import Existing Academy | Varies | Already have data? Start from an import. |
| consultant-setup | Consultant Setup | Varies | Setting this up on behalf of a client academy. |
| multi-location | Multi-Location Academy | ~30 min | Multiple courts, locations, or coaching groups. |

**Draft-only safety copy (visible on this screen):**
"All selections are saved as a draft. Nothing is applied until you reach the Activation Checklist and confirm."

**DONNA panel on Welcome:**
- DONNA avatar + name + title
- DONNA intro message
- Principle: "DONNA proposes. Directors approve. Nothing changes until confirmed."

---

## Step 2 — Academy Basics

**Headline:** "Tell me about your academy."
**Subheadline:** "This shapes your curriculum levels, templates, and coach views."

### Data captured

**Academy Name**
- Text input
- Placeholder: "e.g. Dabul Tennis Academy"

**Locations**
- Number input or location name list
- Placeholder: "How many courts / locations?"

**Primary Academy Model** (single select)
- Junior Development — Long-term player development, structured progression
- High Performance — Elite training, competition calendar, performance metrics
- Adult Program — Adult recreation, fitness, social tennis
- Private Coaching — Private lessons and small group coaching
- Multi-Location Academy — Multiple sites, multiple coaching groups
- Consultant Setup — Setting up for a client

**Age Groups** (multi-select pills with ball level colors)
- Red Ball — Ages 5–8 (color: #FF3B30)
- Orange Ball — Ages 8–10 (color: #FF9500)
- Green Ball — Ages 9–11 (color: #30D158)
- Yellow Ball — Ages 10+ (color: #FFD60A)
- High Performance — Elite juniors (color: #C8FF00 lime)
- Adult — All levels (color: #AAAAAA)

**Primary Goals** (multi-select pills)
- Long-Term Athlete Development
- Competition Pathway
- Fun and Retention
- Physical Fitness
- College Pathway
- Professional Development
- Club and Social Tennis

**Program Type** (single select)
- Year-Round Academy
- Seasonal Program
- After-School Program
- Weekend Program
- Holiday Intensives

### DONNA live confirmation
Appears after academy name is typed and at least one selection is made:
"I'll use this to prepare your starting curriculum structure, class template defaults, and coach group setup."

---

## Step 3 — Coaching DNA

Combines prototype Coaching Philosophy + Coach Communication into one stronger step.

**Headline:** "How do you want players to learn?"
**Subheadline:** "Select up to 3 primary coaching styles and a communication voice."

### Coaching Style Selectors (select up to 3)

Each pill shows: name, one-line explanation, what this changes in AcademyOS.

| ID | Label | Explanation | AcademyOS Impact |
|---|---|---|---|
| fundamentals-first | Fundamentals First | Technique, grips, preparation, and clean contact before complexity | Session templates emphasize structured rep blocks and technical drills |
| game-based | Game-Based Learning | Players learn through constraints, scoring, and live-ball decisions | Templates lead with constraint games and live-ball blocks |
| high-performance | High-Performance Discipline | Clear standards, intensity, accountability, and quality reps | Session defaults include intensity markers, standards, and fitness integration |
| player-centered | Player-Centered Coaching | Confidence, ownership, athlete voice, and individual learning styles | Coach cues emphasize questions, choice, and self-assessment |
| tactical-first | Tactical First | Court geometry, patterns, decisions, and point construction | Templates build toward tactical scenarios and point construction |
| movement-first | Movement First | Footwork, spacing, recovery, and athletic positions | Warm-up and drill blocks emphasize movement quality |
| competition-ready | Competition-Ready | Pressure training, match habits, routines, and tournament behavior | Templates include pressure blocks and competitive scoring |
| joy-retention | Joy + Retention | Fun, belonging, energy, confidence, and long-term love of the game | Session blocks favor game forms, mini-competitions, and celebration moments |

### Communication Style (primary + optional secondary)

| ID | Label | Description | Example Coach Behavior |
|---|---|---|---|
| direct-clear | Direct + Clear | Simple commands, clear standards, fast corrections | "Elbow up. Reset. Again." |
| encouraging-positive | Encouraging + Positive | Confidence-building while still correcting | "Good effort — try bending the knees more." |
| question-led | Question-Led | Guided discovery through smart questions | "What happened when you aimed cross-court?" |
| high-energy | High-Energy Motivator | Energy, enthusiasm, and session momentum | "YES. That's it — keep that swing path!" |
| calm-precise | Calm + Precise | Low-noise, technical, focused coaching | "Two-beat rhythm. Contact point forward." |
| standards-based | Standards-Based | Clear expectations, accountability, and consistency | "We do this every session until it's automatic." |

### Output Preview (shown after selections)
- Coach language style: [example line]
- DONNA coach prompt style: [example line]
- Session coaching tone: [example line]
- Parent-safe summary tone: [example line]

---

## Step 4 — Session + Curriculum Defaults

Combines prototype Session Design + Player Development.

**Headline:** "How should a typical session be built?"
**Subheadline:** "Select building blocks and your player development focus."

### Session Building Blocks (multi-select, with live timeline preview)

Fixed blocks (always included): Warm-Up (10 min) + Reflection (5 min)

| ID | Label | Description | Duration |
|---|---|---|---|
| technique-blocks | Technique Blocks | Structured rep and technical development | 20 min |
| live-ball-heavy | Live Ball Heavy | Rally-based learning and open-skill environments | 25 min |
| constraint-games | Constraint Games | Rules, targets, scoring, and limitations that teach | 20 min |
| point-play | Point Play Progression | Cooperative rally to competitive rally to point play | 20 min |
| stations | Stations + Rotations | Multiple stations for larger groups and multi-court setups | 25 min |
| assessment | Assessment Moments | Short check-ins to capture evidence and coach notes | 10 min |
| fitness-integrated | Fitness Integrated | Physical development built into tennis sessions | 15 min |

Live preview shows:
- Proportional block timeline with colors and durations
- Total estimated session duration
- DONNA summary: "I'll prepare your default session template with: [selected blocks]"

### Development Priority Emphasis (select emphasis sliders or priority pills)

Technical / Tactical / Physical / Mental / Competition

Or priority pills (select up to 5, ordered):
- Technical Foundation
- Tactical IQ
- Movement Quality
- Competitive Toughness
- Emotional Regulation
- Consistency + Rally Tolerance
- Aggressive Identity
- All-Court Development
- Serve + Return Priority
- Independence + Ownership

### Output Preview
- First template structure DONNA will suggest
- Skill path emphasis
- Competition path emphasis
- Fitness path emphasis

**Draft-only rule:** No templates are created or overwritten. DONNA is preparing suggestions only.

---

## Step 5 — Parent + Player Experience

**Headline:** "How should your academy communicate with parents and players?"

### Parent Communication Styles (multi-select)

| ID | Label | Description |
|---|---|---|
| simple-reassuring | Simple + Reassuring | Clear, calm updates without overwhelming parents |
| progress-focused | Progress-Focused | Shows what improved, what is next, and why it matters |
| developmental-education | Developmental Education | Helps parents understand the teaching model |
| actionable-support | Actionable At-Home Support | Gives parents ways to support without interfering |
| minimal-noise | Minimal Parent Noise | Only important updates, no overcommunication |
| transparent-levels | Transparent Level Progression | Shows what the player needs to do to move up |
| tournament-support | Tournament Support Guidance | Helps parents support players emotionally and practically |

### Parent Visibility Rules (toggles)
- Show approved session summaries only (default: ON)
- Hide raw coach notes (default: ON)
- Hide internal director notes (default: ON)
- Hide rankings and comparisons (default: ON)
- Hide unapproved AI interpretations (default: ON)

### Player Mission Style (single select)
- Mission-Based — Players are on a mission with clear objectives
- Game-Like Progress — Leveling up feels like progression in a game
- Calm Confidence — Steady, reassuring, no pressure framing
- High-Energy Challenge — Big goals, big energy, challenge-driven
- Short Frequent Practice — Small wins, daily habits, frequent check-ins
- Level Unlocks — Clear gates with reward recognition
- Celebration Moments — Progress moments are celebrated publicly

### Output Preview
- Parent portal tone: [example sentence]
- Player portal mission tone: [example sentence]
- DONNA parent/player boundaries: [what DONNA will and will not say]
- Private lesson request positioning: [how DONNA handles upgrade requests]

---

## Step 6 — Review Academy DNA

**Headline:** "Here's your Academy DNA draft."
**Subheadline:** "Review before we prepare your starting system."

### Sections displayed
1. Academy Basics — name, model, locations, age groups, goals
2. Coaching DNA — coaching styles, communication style
3. Session + Curriculum Defaults — session blocks, dev priorities
4. Parent Communication — selected styles, visibility rules
5. Player Mission — mission style
6. DONNA Behavior Rules — boundaries and safety defaults

### Activation readiness signal
- All required sections: indicator showing complete / incomplete
- Missing items: listed with "Go back" links
- Estimated readiness: percentage or color signal

### Edit controls
- Each section has an "Edit" link that navigates back to that step

### DONNA suggestions panel (inline)
- DONNA reads the full DNA and offers one to three observations
- Examples: "Your coaching DNA is high-performance focused. I'll suggest more structured templates."
- All suggestions are observations, not mutations

### Copy rules
- "Draft Academy DNA — not yet applied"
- "Review before activation"
- "DONNA will use this to prepare your starting system"
- Never: "Applied," "Updated," "Curriculum created," "Templates generated"

---

## Step 7 — Activate Starting System

**Headline:** "Your starting system is ready to prepare."
**Subheadline:** "Complete these steps to launch your academy."

### Checklist items

| # | Item | Description | Route if available |
|---|---|---|---|
| 1 | Review curriculum spine | Check the curriculum levels and skill domains | `/director/curriculum` |
| 2 | Create first class templates | Build session templates for your primary groups | `/director/class-templates` |
| 3 | Add coaches | Invite coaches and assign groups | `/director/onboarding/coaches-permissions` |
| 4 | Import players | Add your roster and run placement | `/director/onboarding/players-placement` |
| 5 | Assign groups | Assign players to training groups | `/director/players` |
| 6 | Preview parent portal | See the parent experience before going live | `/parent` (preview mode) |
| 7 | Preview player portal | See the player experience | `/player` (preview mode) |
| 8 | Start coach wrap-up | Run a test session wrap-up | `/coach` |

Each item:
- Status: ready / not started / requires prior step
- One-line explanation
- Route link when available
- "Not ready yet" only when the route genuinely does not exist
- DONNA recommended next action

### Safety rules
- No fake activation
- No DB writes unless an existing safe save pattern exists
- No "coming soon" toasts
- No fake "applied" language
- All checklist links must be real routes or clearly labeled as not yet available

---

## Onboarding State Model

```typescript
interface OnboardingDraft {
  // Step 1
  setupMode: string

  // Step 2 — Academy Basics
  academyName: string
  locationCount: number
  academyModel: string
  ageGroups: string[]
  primaryGoals: string[]
  programType: string

  // Step 3 — Coaching DNA
  coachingStyles: string[]           // up to 3, ordered
  primaryCommunication: string
  secondaryCommunication: string

  // Step 4 — Session + Curriculum Defaults
  sessionBlocks: string[]            // selected blocks, ordered
  developmentPriorities: string[]    // up to 5, ordered

  // Step 5 — Parent + Player Experience
  parentStyles: string[]
  parentVisibilityRules: Record<string, boolean>
  playerMissionStyle: string

  // Meta
  currentStep: number
  lastSavedAt: string | null         // ISO timestamp from localStorage
  draftVersion: number
}
```

Default state: all strings empty, all arrays empty, all booleans set to safe defaults (hide raw notes ON, hide comparisons ON).

---

## DONNA Panel Behavior Per Step

| Step | DONNA Message | Panel Content |
|---|---|---|
| Welcome | Introduction message | Principle quote: "DONNA proposes. Directors approve." |
| Academy Basics | "I'm building your academy structure." | Live: name, model, age groups |
| Coaching DNA | "Your coaching identity is taking shape." | Live: coaching styles, communication style |
| Session Defaults | "I'm preparing your template structure." | Live: session blocks, dev priorities |
| Parent + Player | "I'm configuring your communication defaults." | Live: parent style, player mission |
| DNA Review | "This is your Academy DNA draft." | Full DNA summary |
| Activation | "Your starting system is ready to prepare." | Checklist progress |

---

## Setup Mode Behavior

| Mode | Steps shown | DONNA prefills defaults? |
|---|---|---|
| fast-start | 1, 2 (name + model only), 6, 7 | Yes — DONNA fills DNA with smart defaults |
| guided-setup | 1, 2, 3, 5, 6, 7 | Partial — session defaults prefilled |
| full-setup | All 7 steps | No — director fills everything |
| import-existing | 1, import UI, 6, 7 | From import data |
| consultant-setup | All 7 steps + consultant notes | No |
| multi-location | All 7 steps + location-specific overrides | No |

For Sprint O-3 through O-12, all modes will navigate through the same step components. Mode primarily affects which steps are required vs optional, and whether DONNA prefills defaults for skipped steps.

---

## Route Plan

| Route | Component | Notes |
|---|---|---|
| `/director/onboarding` | Replaced by new DONNA shell | Existing route gets new shell in O-3 |
| `/director/onboarding` step state | React context, no sub-routes | Single page, step state managed in context |
| Subroutes `/director/onboarding/interview` etc | Preserved | Existing functional steps remain accessible |

The new DONNA onboarding will render at `/director/onboarding` as a full-screen shell that replaces the current checklist entry point. The existing functional subroutes (interview, curriculum, etc.) remain accessible and the Activation Checklist (Step 7) will link to them.

---

## Language Rules

### Correct
- "DONNA drafted these changes"
- "This is your Academy DNA draft"
- "Review before applying"
- "Applied to onboarding draft"
- "DONNA prepared these defaults"
- "DONNA will suggest"
- "DONNA will prepare"

### Incorrect — never use
- "Academy updated"
- "Curriculum updated"
- "Templates created"
- "Applied" (unless state actually changed)
- "Changes approved. Updating your DNA..." (prototype had this — do not copy)
- "Feature coming soon" toasts (prototype had this — do not copy)
- "I'll apply X styles to all messages" (prototype had this — do not copy)
