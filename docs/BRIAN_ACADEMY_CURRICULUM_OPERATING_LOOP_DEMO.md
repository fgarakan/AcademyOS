# Brian's Academy Curriculum Operating Loop Demo

**Sprint:** 80
**Demo actor:** Brian (academy_director at Dabul Academy)
**Last updated:** 2026-05-01

---

## Pre-conditions

1. Sign in as `brian@dabulacademy.com` (academy_director role)
2. Migrations 001–048 applied
3. Dabul Academy has an active academy curriculum version ("Dabul Academy Curriculum V1")
4. At least one applied curriculum override exists (e.g., "more return-of-serve for Orange 2")
5. At least one template with `curriculum_level_id` set to Orange 2 — Direction

---

## Step 1 — Confirm Academy Curriculum Version

**Action:** Navigate to `/director/curriculum`

**What Brian sees:**
- Academy Curriculum Version card: "Dabul Academy Curriculum V1", status = active
- Override count showing applied overrides
- Voice Curriculum Customization panel enabled

**Say:** "Brian has already created his academy curriculum version. It lives here alongside the global spine — the global master is untouched."

---

## Step 2 — Open a Curriculum-Aware Template

**Action:** Navigate to a template with Orange 2 curriculum level set. Open `/director/fitness/templates/[templateId]`

**What Brian sees:**
- Template detail page
- Curriculum Focus selector showing "Orange 2 — Direction"
- Blocks listed

**Action:** Click "Populate Blocks from Curriculum"

**What Brian sees after population:**
- Block notes now include:
  ```
  [Curriculum: Orange 2 — Direction]
  [Academy Version: Dabul Academy Curriculum V1]
  [Override Focus: return-of-serve]

  ACADEMY CUSTOMIZATIONS:
  • More return-of-serve work for Orange 2 players

  DRILLS / SKILLS:
  • Return of Serve Patterns (8–12 min)
  • ...
  ```

**Say:** "The academy's override for return-of-serve work is now baked into the block notes. Every coach who uses this template sees the academy-specific emphasis, not just the global default."

---

## Step 3 — Generate a Session from the Template

**Action:** Click "Generate Session" → Set date, select coach, click Generate

**What happens:**
- Session created
- `session_notes` contains:
  ```
  [Curriculum: Orange 2 — Direction]
  [Academy Version: Dabul Academy Curriculum V1]
  [Academy Overrides: 1 active]
  • More return-of-serve work for Orange 2 players
  ```

**Say:** "The session is a snapshot of the curriculum at this moment. The academy version and its active customizations are locked into the session record."

---

## Step 4 — Open the Session

**Action:** Navigate to `/director/sessions/[sessionId]`

**What Brian sees:**
- CURRICULUM FOCUS section shows:
  - Level: "Orange 2 — Direction" with stage label
  - Academy Version badge: "Dabul Academy Curriculum V1"
  - Academy Customizations: "• More return-of-serve work for Orange 2 players"
  - "Internal coach context only — not visible to players or parents."

**Say:** "Every coach opening this session sees both the level and the academy-specific emphasis. The guardrail note makes clear this is internal only."

---

## Step 5 — Open a Player Profile

**Action:** Navigate to a player in the Orange 2 group → Skill Path tab

**What Brian sees:**
- Curriculum Assignment card at the top:
  - Green indicator: "Curriculum source: Dabul Academy Curriculum V1"
  - Assigned Level: Orange 2 — Direction
  - Active Overrides: 1
  - Override summary: "More return-of-serve work for Orange 2 players"
  - Link: "Manage academy curriculum →"

**Say:** "Every player profile now shows whether they're being evaluated under the global curriculum or Dabul's customized version. Directors can see exactly which academy overrides affect a player's level."

---

## Step 6 — View Requirements Source

**Action:** Stay on player profile → scroll to Notes tab

**What Brian sees:**
- Requirements source indicator:
  ```
  ● Requirements source: Dabul Academy Curriculum V1 · 1 override active
  ```
- Requirement progress rows unchanged — read-only, same guardrails

**Say:** "The requirements section now labels which curriculum version it's reading from. The requirements themselves are still global — the override adds coaching emphasis, not new requirements."

---

## Step 7 — View the Curriculum Connection Audit

**Action:** Navigate to `/director/curriculum/academy-version`

**What Brian sees:**
- Academy Curriculum Version summary (name, status, version number, applied count)
- Applied overrides list
- Curriculum Connection Audit section:
  - Academy Version: Active ✓
  - Applied Overrides: 1
  - Templates with level: N
  - Templates without level: 0 (if all tagged)
  - Players (assigned): X / Y

**Say:** "The audit shows Brian exactly what's connected and what isn't. If templates or players are missing curriculum assignments, the recommendations tell him exactly what to do."

---

## Step 8 — Confirm Global Master Unchanged

**Action:** Navigate back to `/director/curriculum`

**What Brian sees:**
- 15 curriculum levels (unchanged)
- 29 Orange Ball content items (unchanged)
- No director edit controls on global data

**Say:** "The global curriculum spine is exactly as it was. Dabul Academy's customizations exist only in the academy curriculum version — they never touch the master."

---

## Demo Complete

**Summary of the operating loop demonstrated:**

1. Global master curriculum exists, read-only for directors
2. Academy curriculum version created once, reused everywhere
3. Voice/typed override → review queue → apply → stored in academy version
4. Template block population picks up academy version + override context
5. Session generation preserves version + override context in session notes
6. Coach session view shows academy-specific curriculum emphasis
7. Player profiles show curriculum source (global vs academy version)
8. Requirements source indicator prevents confusion about which curriculum applies
9. Curriculum audit shows connection gaps + recommendations
10. Global master untouched throughout

**Guardrails demonstrated:**
- academy_id always from auth profile
- No AI API calls (all deterministic)
- No player level mutations
- No parent/player visibility
- No communications sent
- All changes audited
- Global curriculum protected
