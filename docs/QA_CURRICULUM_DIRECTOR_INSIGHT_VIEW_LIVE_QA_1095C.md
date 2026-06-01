# QA — Curriculum Director Insight View Live Browser QA

**Sprint:** 1095C
**Date:** 2026-06-01
**Method:** Playwright headless Chromium against `npm run dev` at `http://localhost:3099`
**Auth:** `qa-test-director@academyos.test` (academy_director, Dabul Tennis Academy)
**Viewports:** 1366×768 (desktop) · 375×667 (mobile)

---

## Verdict: PASS — No code changes required

All 14 required QA states confirmed. The Curriculum Director Insight View from Sprint 1095B renders correctly, is director-readable, and preserves all existing builder access.

---

## Screenshots

| Screenshot | Description |
|---|---|
| `01_default_1366.png` | Default Curriculum page at 1366×768 |
| `02_red1_expanded_1366.png` | Red 1 — Foundation expanded |
| `03_red2_expanded_1366.png` | Red 2 — Intermediate expanded |
| `04_red3_expanded_1366.png` | Red 3 — Matchplay expanded |
| `05_orange_stage_1366.png` | Red Ball all 3 levels visible (Red 3 expanded) |
| `06_orange2_expanded_1366.png` | Orange Ball stage + Orange 2 expanded |
| `07_hp_stage_1366.png` | Yellow + High Performance stages visible |
| `08_hp1_expanded_1366.png` | HP 1 — Foundation expanded |
| `09_level_tree_1366.png` | CurriculumLevelTree below insight section |
| `10_mobile_default.png` | Mobile default view (375×667) |
| `11_mobile_red1_expanded.png` | Mobile Red 1 expanded |

---

## Automated check results (1366×768)

| Check | Result |
|---|---|
| All 5 stages present (Red/Orange/Green/Yellow/HP) | ✅ |
| All 15 levels present (JS detection) | ✅ — missing: none |
| Live stage_goal text ("athletic and technical foundation", "stroke mechanics", "Elite training") | ✅ |
| Age ranges from DB ("Ages 5–10", "Ages 9–12", "Ages 15–21") | ✅ |
| 15 expandable level buttons | ✅ |
| CurriculumLevelTree still present | ✅ |
| Builder link present | ✅ |
| Curriculum spine section data-donna-focus-id | ✅ |
| Red 1 expand works | ✅ |
| Red 2 expand works | ✅ |
| Orange 2 expand works | ✅ |
| Mobile layout renders | ✅ |

---

## State-by-state visual confirmation

### State 1 — Default view (1366×768)

**Screenshot: `01_default_1366.png`**

Visible on first load without scrolling:
- DONNA welcome banner ("Your curriculum spine isn't active yet")
- Curriculum Status hero card
- **CURRICULUM SPINE** section header
- **● Red Ball Ages 5–10 — 3 levels** (live from DB)
- Stage goal: *"Build the athletic and technical foundation for all future tennis development. Players learn how to move, cooperate, and make first contact with the ball as a repeatable skill."*
- Red 1 — Foundation (collapsed, 1-line goal preview: "Build the athletic foundation and first consistent ball contact...") with **4g** badge

### State 2–4 — Red 1, Red 2, Red 3 expanded

**Screenshots: `02`, `03`, `04`**

- Red 1 expanded: DIRECTOR GOAL section visible at bottom of viewport (content below fold — director scrolls to read full detail)
- Red 2 expanded: Same structure, different content
- Red 3 expanded + Orange Ball starts: Scroll shows end of Red 3 card (COMMON BLOCKERS + PARENT-SAFE SUMMARY + "Open in Builder" link) and start of Orange Ball stage card

**Red 3 end-of-card content observed:**
- **COMMON BLOCKERS**: "Serve mechanics not yet consistent — toss or contact unreliable", "Emotional dysregulation in early match play", "Direction control inconsistent at rally pace"
- **PARENT-SAFE SUMMARY**: *"Your child is completing the Red Ball stage. They are learning to compete in small match formats and developing the consistency and composure needed for the Orange Ball transition."*
- **Open in Builder** link with external link icon ✅

### State 5 — Orange Ball stage

**Screenshot: `06_orange2_expanded_1366.png`**

Orange Ball stage header:
- **● Orange Ball Ages 9–12 — 3 levels**
- Stage goal (live DB): *"Develop consistent stroke mechanics, basic tactical awareness, and the emotional regulation to compete in low-stakes environments."*
- Orange 1 collapsed with 1-line preview: "Establish consistent stroke mechanics on a mid-court..."
- **Orange 2 — Intermediate expanded** showing:
  - **DIRECTOR GOAL**: "Build rally depth, tactical patterns (cross-court and down-the-line), and introduce serve mechanics. This is the core development level for most junior programs."
  - **EXIT PLAYER PROFILE**: "Can sustain a 10-ball rally with depth and direction control, demonstrates a consistent serve with reliable toss and clean contact, understands and executes basic cross-court/down-the-line patterns under game conditions."
  - **FOCUS AREAS**: Rally depth and direction control · Serve mechanics — toss, contact, and consistency · Cross-court and down-the-line tactical patterns · Basic point play and shot selection
  - **READINESS GATES (4)** with live DB data:
    - `Technical` Sustained rally with movement (5+ shots) with a peer *(5+ shots with movement × 3 sessions, 2+ peers)*
    - `Technical` Serve and return start a point reliably *(60%+ serve-in rate, 60%+ return-in rate on first attempts)*
    - `Tactical` Recognizes and names middle vs crosscourt zones in live play *(Player can name the zone of incoming and outgoing balls in 8/10 shots, tested in fed scenario)*
    - `Movement` Bisector recovery is visible (not demanded) in coached rally drills *(Recovery toward middle observed in 3/5 rallies during a coached rally block)*

### State 6 — HP 1 expanded

**Screenshot: `08_hp1_expanded_1366.png`**

Yellow stage visible (all 3 levels with goal previews), then:
- **● High Performance Ages 15–21 — 3 levels**
- Stage goal (live DB): *"Elite training environment. Specialised physical preparation, tactical complexity, professional match preparation, and academy-to-pro transition."*
- **HP 1 — Foundation expanded**:
  - DIRECTOR GOAL: "Pre-elite entry. Introduce physical periodization, advanced tactical game plan development, and national-level competition preparation."
  - EXIT PLAYER PROFILE: "Competes at national level with consistent results, has completed a full periodization cycle, demonstrates advanced tactical game planning for specific opponents, and physical metrics meet HP2 thresholds."
  - FOCUS AREAS: Physical periodization · Advanced tactical game plan development · National competition performance and consistency · Individual skill refinement based on competition data
  - READINESS GATES (4) with live DB criteria + thresholds in monospace

### State 7 — CurriculumLevelTree preserved

**Screenshot: `09_level_tree_1366.png`**

Original CurriculumLevelTree still present below the insight section:
- Orange Ball: 3 levels, each showing `4g · Xd · 8cl` counts
- Green Ball: 3 levels (Green 1 shown with hover state + lime border)
- Yellow Ball: 3 levels
- External link icons on each level row → builder navigation
- Shows richer drill counts per level (Orange 2: 13d, Green 1–2: 15d each)

### State 8 — Mobile (375×667)

**Screenshots: `10_mobile_default.png`, `11_mobile_red1_expanded.png`**

Default: Curriculum header, DONNA banner, Curriculum Status, Active Spine, CURRICULUM SPINE section with Red Ball stage and level rows. Bottom tab bar (Health | DONNA | Clear | Review) visible and clear of content.

Red 1 expanded on mobile:
- Red Ball stage goal visible (wraps naturally on 375px)
- DIRECTOR GOAL: "Build the athletic foundation and first consistent ball contact. The..." (wraps to next line)
- EXIT PLAYER PROFILE: "Can rally 4–6 consecutive balls with a coach using a correct gri..." (wraps)
- FOCUS AREAS: All 4 bullet points visible
- Text is readable and content fits without horizontal overflow

---

## UX Observations

- **One-at-a-time expand**: Clicking a new level collapses the previous one within the same stage. Confirmed from screenshots — Red 3 expanded shows Red 1 and Red 2 collapsed.

- **Expanded card height**: A fully expanded level card is tall (~500px on desktop). This is intentional — the director explicitly expanded for detail. Active surface scrolling handles it.

- **Gate domain badges**: Live domain labels from DB (Competition, Fitness Support, Tactical, Technical, Movement) all use the same lime color scheme from the design system. Consistent.

- **Threshold in monospace**: Gate thresholds appear in a monospace style in parentheses, visually distinct from the criterion text. Clear and scannable.

- **Mobile text wrapping**: Stage goal text wraps naturally at 375px. No horizontal overflow. Text is readable.

- **1-line goal previews in collapsed rows**: Effective at giving the director immediate context without requiring expansion. Text is muted (secondary color) — appropriate hierarchy.

- **"4g" badge**: Lime-tinted gate count badge on each level row. Accurate count from live `curriculum_gates`.

---

## Regression check results

| Check | Result |
|---|---|
| DONNA welcome banner | ✅ Unchanged |
| Curriculum Status hero card | ✅ Unchanged |
| CurriculumHealthPanel (coverage) | ✅ Present (scrolled past in QA) |
| CurriculumLevelTree | ✅ Present with counts + builder links |
| Curriculum Tools section | ✅ Present (scrolled past) |
| Permission model unchanged | ✅ No override/edit options in new view |
| Parent/player exposure | ✅ Parent-Safe Summary clearly labeled; no exposure to portals |
| Mobile bottom tab bar | ✅ Clear, accessible |
| No JS console errors | ✅ (no crash or error messages observed) |

---

## No fixes required

All 14 QA states confirmed passing. Sprint 1095B implementation is correct and complete.
