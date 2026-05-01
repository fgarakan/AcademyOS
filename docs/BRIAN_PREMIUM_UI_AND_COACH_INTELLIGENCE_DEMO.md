# Brian's Premium UI and Coach Intelligence Demo

**Sprint:** 90
**Demo actor:** Brian (academy_director at Dabul Academy)
**Date:** 2026-05-01

---

## Pre-conditions

1. Sign in as `brian@dabulacademy.com` (academy_director role)
2. Migrations 001–048 applied
3. Dabul Academy has an active academy curriculum version ("Dabul Academy Curriculum V1")
4. At least one applied curriculum override (e.g., "more return-of-serve for Orange 2")
5. At least one template with `curriculum_level_id` set to Orange 2 — Direction
6. At least one active group with players who have development summaries and priorities recorded
7. A session generated from the curriculum-aware template, assigned to that group

---

## Step 1 — Curriculum Command Center

**Action:** Navigate to `/director/curriculum`

**What Brian sees:**
- "DIRECTOR" label, "Curriculum" heading, subtitle
- **Primary section:** Academy Curriculum Version card — "Dabul Academy Curriculum V1", status = active, version number, override count
- **Voice panel** below it for typing new customizations
- "How It Works" numbered guide: Create → Customize → Review → Use
- Quick navigation links to Templates, Review Queue, Sessions, Academy Version
- "Global Curriculum Foundation" stats section at bottom: Spine (15 levels, requirements), Content Library, Curriculum Templates

**Say:** "The curriculum page now leads with Brian's academy version — it's the most important context because it drives every session. The global spine is read-only for directors; Brian's customizations live in his academy version."

---

## Step 2 — Academy Curriculum Version Detail

**Action:** Click "Academy Version" link or navigate to `/director/curriculum/academy-version`

**What Brian sees:**
- Back link to Curriculum
- Header: "Academy Curriculum Version" with clean subtitle
- Version Details card: name, status, version number, applied overrides count
- "Applied Curriculum Overrides" section with diff cards
- "Connection Audit" compact strip:
  - Version: Active ✓
  - Applied: N
  - Rolled back: 0
  - Templates with level: N
  - Players assigned: X / Y
- Attention items if any gaps (orange for missing, green for healthy)

**Say:** "This page is now easy to scan. The audit strip tells Brian at a glance what's connected. If templates are missing a curriculum level or players are unassigned, the recommendations tell him exactly what to do."

---

## Step 3 — Review Queue Overview

**Action:** Navigate to `/director/review`

**What Brian sees:**
- "Draft Review Queue" heading with total pending/ready badges
- **Category summary strip:** Session Recaps / Priorities / Evidence / Attendance / Curriculum — each with their pending and ready counts
- Sections scroll below: Session Recap Drafts, Priority Recommendations, Evidence Links, Attendance Exceptions, Curriculum Override Drafts

**Say:** "The review queue now shows Brian exactly where his attention is needed before he scrolls. If he has 3 curriculum overrides pending and 2 priority recommendations ready to apply, he sees that instantly."

---

## Step 4 — Curriculum-Aware Template

**Action:** Navigate to a template with Orange 2 curriculum level set. Open `/director/fitness/templates/[templateId]`

**What Brian sees:**
- Template name / back link
- **Curriculum Intelligence section at top:**
  - "Curriculum Intelligence" label
  - Subtitle: "Set the curriculum focus, then populate block notes with level-appropriate drills, coaching cues, and academy customizations."
  - Level selector showing "Orange 2 — Direction"
  - "Uses your academy curriculum version and approved overrides."
  - "Populate Blocks from Curriculum" button — primary action
- Generate Session panel below
- Template meta stats below that
- Exercise Population section
- TemplateEditor at bottom

**Say:** "The curriculum section is now the first thing a director sees on the template page. The most important action — populate from curriculum — is front and center. The copy makes clear this picks up the academy's approved customizations."

**Action:** Click "Populate Blocks from Curriculum"

**What happens:** Block notes fill with curriculum context including the return-of-serve override.

---

## Step 5 — Coach Session View

**Action:** Navigate to a session generated from this template, assigned to the Orange 2 group. Open `/director/sessions/[sessionId]`

**What Brian sees:**
- Session header: name, status, date, duration, coach
- **Curriculum Focus section near top:**
  - "Orange 2 — Direction" level
  - "Academy Version: Dabul Academy Curriculum V1"
  - Academy Customizations: "More return-of-serve work for Orange 2 players"
  - "Internal coach context only — not visible to players or parents."
- **Coach Briefing section:**
  - "X players in class · Orange 2 Group"
  - Watch for today:
    - "Academy emphasis: More return-of-serve work for Orange 2 players"
    - "N players with active focus areas"
    - "N players with active priorities"
  - Capture after class:
    - "Record a session recap in the Coach Recap section below"
    - "Note attendance for N unrecorded players"
- Compact snapshot notice: "Planned session snapshot — changes here do not affect the master template."
- Session meta stats card
- Group Assignment panel
- **Class Roster Intelligence:** Per-player cards showing:
  - Player name + curriculum level + source
  - Strengths (green dots)
  - Focus areas (orange dots)
  - Current priority
  - Attendance status pill
- Session Blocks (with curriculum-populated notes)
- Roster & Attendance
- Attendance Exceptions
- Coach Recap

**Say:** "Every coach who opens this session now sees three things before they read a single block: what level this class is at, the academy-specific emphasis, and a briefing on each player's strengths and needs. This is what getting every coach on the same page looks like."

---

## Step 6 — Player Profile

**Action:** Navigate to a player in the Orange 2 group → Skill Path tab

**What Brian sees:**
- PlayerCurriculumAssignmentCard at top:
  - Curriculum source: "Dabul Academy Curriculum V1"
  - Assigned Level: Orange 2 — Direction
  - Active Overrides: 1
  - Override summary: "More return-of-serve work for Orange 2 players"
- Requirements progress below

**Say:** "Player profiles still show the curriculum source. Directors can verify each player is being evaluated under Dabul's customized version, not just the global default."

---

## Demo Complete

**Summary of what was shown:**
1. Curriculum command center — academy version is primary
2. Academy version detail — clean audit strip with attention items
3. Review queue — category summary strip for instant queue overview
4. Template page — curriculum intelligence as primary section
5. Session page — curriculum focus near top, coach briefing, class roster intelligence
6. Player profile — curriculum source confirmed

**Core message:**
> Academy OS now ensures every coach walks into every session with the same information: the curriculum level, the academy's specific emphasis, and the development context for each player in the class. The director sets it once in the academy curriculum version; it flows everywhere automatically.
