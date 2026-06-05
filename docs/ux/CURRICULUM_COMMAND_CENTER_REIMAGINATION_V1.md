# Curriculum Command Center Reimagination V1

**Date:** 2026-06-05
**Transformation:** Curriculum Browser → Curriculum Command Center
**Core Principle:** DONNA tells you what's broken. The UI proves it. The director fixes it.

---

## Design Philosophy

The current curriculum page is a browser — a place to explore curriculum structure.

The Curriculum Command Center is an operational surface — a place to act on curriculum problems.

A director who opens the curriculum page is not browsing. They are asking:
- Where is my curriculum struggling?
- Which level needs my attention?
- What should improve first?

These three questions must be answered above the fold.

---

## Information Hierarchy

### Zone 1 — Page Identity (micro)

```
CURRICULUM COMMAND CENTER
```

- No subtitle needed
- No DONNA welcome
- No setup orientation
- Just the page name — the rest is intelligence

---

### Zone 2 — DONNA Curriculum Brief (one surface, above fold)

```
┌─────────────────────────────────────────────────────────────────┐
│  DONNA                                                          │
│  "Orange Ball 2 is your most blocked level — 4 players stalled │
│   for an average of 187 days. The main blocker is consistency  │
│   in cross-court groundstrokes. Review the gate evidence."     │
│                                                                 │
│  [Review Orange Ball 2 →]                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Rules:**
- One DONNA surface only. No welcome card, no builder welcome, no setup welcome.
- Lead with the most blocked level name and why it's blocked.
- One specific action: "Review [level name]".
- If no blockers exist: "Curriculum is healthy — N levels active, all gates covered."
- 2 sentences max. DONNA does not summarize the entire curriculum.

---

### Zone 3 — Most Blocked Level Card (the command surface)

```
┌──────────────────────────────────────────────────────────────┐
│  MOST BLOCKED LEVEL                                          │
│                                                              │
│  Orange Ball 2                                               │
│  4 players stalled · Avg 187 days · 38% gate completion     │
│                                                              │
│  Top blocker: Consistency — Cross-Court Groundstrokes        │
│                                                              │
│  [Improve This Level →]                    [View All Levels] │
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
- This is the primary action card — lime border, prominent.
- Shows: level name, stall count, avg days stalled, gate completion %.
- Shows top blocker as a single phrase (not a list).
- "Improve This Level" = navigates to `?improve=[levelKey]` → opens DONNA context panel.
- "View All Levels" = ghost button linking to the level tree drilldown below.
- If no blocked level: "All levels progressing normally" with curriculum health % only.

---

### Zone 4 — Curriculum Health (evidence strip)

```
┌──────────────────────────────────────────────────────────────┐
│  CURRICULUM HEALTH                              Score: 74%   │
│                                                              │
│  Gates ███████████░░  11/14   Drills ██████░░░░  6/10       │
│  Coach Cues ████████░  8/10  Coverage ████░░░░░░  4/10      │
│                                                              │
│  [Open Health Report →]                                      │
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
- 4 key dimensions with mini progress bars: Gates, Drills, Coach Cues, Coverage
- Overall score in the top right
- No full `CurriculumHealthPanel` here — just the summary strip
- "Open Health Report" expands the full panel as a drilldown below (not navigation away)
- Color coding: >80% = lime, 50-80% = orange, <50% = red

---

### Zone 5 — Top Curriculum Priorities (ranked, 3 max)

```
┌──────────────────────────────────────────────────────────────┐
│  CURRICULUM PRIORITIES                                       │
│                                                              │
│  1  [●] Orange Ball 2 — 4 players stalled     [Improve →]   │
│  2  [◐] Red Ball 1 — missing 3 coach cues     [Fix →]       │
│  3  [○] Green Ball — no fitness guidance      [Add →]       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
- Maximum 3 items. Ranked by DONNA attention score.
- Each item: severity indicator, level name + specific problem, single action.
- Actions use `?improve=[levelKey]` parameter to surface DONNA context inline.
- No item should say "review curriculum" — each item identifies a specific level + specific gap.
- If no priorities: "All curriculum priorities are clear — no gaps detected."

---

### Zone 6 — Improvement Queue (optional, collapsed by default)

```
▶  Pending improvements (3)
```

When expanded:
```
┌──────────────────────────────────────────────────────────────┐
│  PENDING IMPROVEMENTS                                        │
│                                                              │
│  Orange Ball 2 — Add 2 coach cues for cross-court rally     │
│  Red Ball 1 — Connect fitness guidance for movement phase   │
│  Green Ball — Add parent guidance for competitive stage     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Rules:**
- Collapsed by default with count badge
- Items come from `academy_suggestions` (curriculum gap type)
- Each item links to the relevant level + improvement flow
- Empty state: hidden entirely (no "0 improvements" empty state)

---

### Zone 7 — Curriculum Tree (drilldown, collapsed by default)

```
▶  Curriculum levels (14)
```

When expanded: shows the existing `CurriculumLevelTree` component.

**Rules:**
- Collapsed by default — this is structure, not intelligence
- Label includes level count so director knows scope
- Opening shows the existing level tree (no redesign of tree itself in V1)
- Gates, drills, and coach cues visible per level on expand

---

### Zone 8 — Curriculum Tools (secondary, bottom)

```
▶  Curriculum tools
```

When expanded: compact links to Builder, Map, Guided Review, Learning Modules.

**Rules:**
- Collapsed by default
- This is navigation, not intelligence — belongs at the bottom
- No large tool cards — just a tight list of 4 links with one-line descriptions

---

## What Is Removed

| Removed | Reason |
|---------|--------|
| `CurriculumBuilderWelcome` (DONNA welcome) | Replaced by Zone 2 brief |
| Status hero card (full layout) | Replaced by Zone 3 most-blocked card |
| Setup Status checklist (post-setup) | Hidden when setup is complete |
| "Connected System" section (4 info cards) | Orientation content — not operational |
| "Next Recommended Actions" numbered list | DONNA absorbs this into Zone 2 brief |
| Curriculum Spine descriptive stage cards | Moved to drilldown or removed |
| Full `CurriculumHealthPanel` above fold | Replaced by Zone 4 health strip |
| "Curriculum Tools" as first-class section | Moved to collapsed Zone 8 |

---

## What Is Preserved

| Preserved | Where |
|-----------|-------|
| Most blocked level intelligence | Zone 3 — promoted to hero |
| `CurriculumIntelligenceCard` data | Powers Zone 3 + Zone 5 |
| Curriculum Health report | Zone 4 strip (full panel in drilldown) |
| Level tree | Zone 7 (collapsed drilldown) |
| DONNA `?improve=[levelKey]` context panel | Still triggered from Zone 3 and Zone 5 actions |
| Setup checklist | Shown only if setup is incomplete; hidden post-setup |
| Version status badge | Micro-text near page identity (not a card) |

---

## Above the Fold — Exact Requirement

At 1280px desktop, without scrolling:
- Zone 1 (identity)
- Zone 2 (DONNA brief)
- Zone 3 (most blocked level)
- Zone 4 (health strip)
- Zone 5 (top priorities — at least 1-2 items visible)

Zone 6-8 are below the fold — this is correct. They are exploration, not command.

---

## State Variants

### Healthy State (no blockers)

Zone 2: "Curriculum is healthy — 14 levels active, all major gaps addressed."
Zone 3: Replaced by: "All levels progressing — no stalled players detected." (no lime border)
Zone 4: Health strip shows green scores.
Zone 5: "No curriculum priorities — academy curriculum is complete."

### No Curriculum Version State

Zone 2: "No curriculum spine is active. Set up your curriculum to begin coaching with structure."
Zone 3: Single setup CTA: "Start Curriculum Setup →" (lime button, full width)
Zone 4: Hidden.
Zone 5: Hidden.
Zone 7: Shows placeholder spine stages (existing behavior).

### Draft In Progress State

Zone 2: "Your curriculum draft is pending approval. Review and approve to activate it."
Zone 3: Shows draft status with "Review Draft →" as primary CTA.
Zone 4: Hidden (no coverage data until active).

---

## DONNA Brief — Content Rules

For the curriculum DONNA brief (Zone 2):

1. If `mostBlockedLevelName exists and stalledCount > 0`:
   Lead: "Orange Ball 2 is your most blocked level — N players stalled for avg X days."
   Support: "The main blocker is [topTaggedConcern]. Review the gate evidence."

2. Else if `curriculumRanking.attentionScore === 'needs_attention'`:
   Lead: "Your curriculum has N priority gaps — [topConcern] needs attention."
   Support: "Check the priorities below and address the highest-impact gaps first."

3. Else if `hasCurriculumGaps` and no stalls:
   Lead: "No players are stalled, but N curriculum gaps remain unaddressed."
   Support: "Filling these gaps prepares coaches before problems appear."

4. Else if curriculum setup incomplete:
   Lead: "Your curriculum setup is N% complete."
   Support: "Finish connecting templates and players to unlock full intelligence."

5. Else (healthy):
   "Curriculum is healthy — N levels active. All major gates and drills are covered."

---

## Design Token Rules

- Zone 3 card: `border-lime/40` when blocked, `border-border` when healthy
- Zone 4 health bar: progress bars colored by value (lime/orange/red)
- Zone 5 priority rows: same severity indicators as director homepage
- Zone 7 collapsed label: count badge in font-mono text-text-muted
- All zones: `p-6 space-y-6` page container (matching existing pattern)
