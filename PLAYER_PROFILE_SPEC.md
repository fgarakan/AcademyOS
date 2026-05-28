# Player Profile — Data Object Specification

## Core Principle

The Player Profile is the system's source of truth. It is a staff tool — not a player-facing screen. Players and parents never see tabs, scores, or internal data. They receive curated views built from this data.

**Tab visibility by role:**

| Role | Tabs visible | Tab count |
|---|---|---|
| Director | All 9 tabs | 9 |
| Head Coach | 6 tabs (Today's Focus, Curriculum, Development, Competition, Notes, Load) | 6 |
| Coach | 5 tabs (Today's Focus, Curriculum, Development, Notes, Load) | 5 |
| Player | No tabs — single scrolling view (separate screen) | — |
| Parent | No tabs — single scrolling view (separate screen) | — |

Coach does not see the Recommendations tab (they execute, they don't approve). Coach does not see the Signals + Priorities tab by that name — the relevant output surfaces in Today's Focus instead.

---

## Header Bar (all staff roles — always visible)

```
[Avatar]  Player Name                                    [Status pill]
          Green Performance · Level 3 — Identity         Needs Attention
          Coach: Alex Chen  ·  Group: Elite-A  ·  UTR: 4.2 ↑
```

**Status pill language (not urgency labels):**
- `ACTION NEEDED` — red background — was: immediate
- `NEEDS ATTENTION` — orange — was: urgent
- `CHECK IN` — amber — was: high
- `ON TRACK` — muted grey — was: monitor

Raw score number is **not shown** in the header. The status label replaces it for all coach views. Directors can see the score in the Overview tab if they open it.

---

## Tab 1: Today's Focus

**Visible to:** Director, Head Coach, Coach  
**Purpose:** What should this player work on right now? What should I watch for in today's session?

This tab is the coach's default landing when opening a player profile. It translates the engine's output into plain English. No signal names, no score numbers, no model language.

**Layout:**

### Focus Block (top, full width)
```
┌────────────────────────────────────────────────────────┐
│  TODAY'S FOCUS                                         │
│                                                        │
│  Downswing — Topspin production under pace             │
│                                                        │
│  Marcus is reverting to a flat swing when the ball    │
│  comes fast. Focus today on keeping the low-to-high    │
│  swing path under pressure. Reduce session intensity   │
│  — load warning active.                                │
│                                                        │
│  ⚠️  Load warning: ease intensity today                │
└────────────────────────────────────────────────────────┘
```

### Top 3 Focus Areas (max 3 items — never more)

Each item is a plain-English card:
```
1  Downswing                         [Active]
   Build topspin consistency under pace
   Suggested: Swing Path Ladder drill → [Open]

2  Competition Behavior              [Building]
   Maintain routine under match pressure
   Suggested: Tiebreak Simulation → [Open]

3  Assessment due in 4 days          [Action needed]
   Last assessment: 19 days ago
   → [Schedule Assessment]
```

**Rules:**
- Maximum 3 items. If the engine generates more, show the top 3 by priority rank.
- Each item must have: domain name, one plain-English sentence, one suggested drill or action.
- Drill links open the exercise detail in the library.
- "Assessment due" appears as a focus item when overdue — not as a signal label.

### Flags (below focus areas — collapsed by default)

```
⚠️  Load warning — ease intensity today        [Details ↓]
```
Expand → shows 7-day load bar and fatigue level without raw numbers. "High load this week. Reduce volume by ~20% today." Not: "fatigue_risk_score: 0.74".

---

## Tab 2: Curriculum

**Visible to:** Director, Head Coach, Coach  
**Purpose:** Where is this player in their development pathway? Are they stuck or moving forward?

### Pathway Strip
```
RED ──── ORANGE ──── [GREEN] ──── YELLOW ──── HP
                       ●
                    Level 3 of 3
                    Green Performance
```
Current stage highlighted in lime. Stage names only — no sort numbers.

### Domain Progress (8 tiles — 4×2 grid)

Each tile:
```
┌──────────────────┐
│  Movement        │
│  ████████████    │
│  Complete ✓      │
└──────────────────┘

┌──────────────────┐
│  Downswing       │
│  ████████░░░░    │
│  Building        │  ← not "In Progress"
└──────────────────┘

┌──────────────────┐
│  Competition     │
│  ████░░░░░░░░    │
│  Working on      │  ← not "Not Started"
└──────────────────┘
```

Status labels:
- `Complete ✓` — was: complete (status = 'complete')
- `Building` — was: in progress (status = 'in_progress')
- `Working on` — was: not started (status = 'not_started')
- `Needs review` — was: regressed (status = 'regressed') — shown in orange

**Domain tile expand** (coach taps tile):
- Shows the plain-English description from `skill_progressions.description`
- Shows success criteria as a short bullet list
- Does NOT show: signal_indicators, failure_patterns (these are for director only)
- Director expand shows all fields including failure_patterns and signal_indicators

### Advancement Status
```
┌────────────────────────────────────────────────────────┐
│  READY TO ADVANCE?                                     │
│                                                        │
│  Not yet — 2 things needed:                            │
│  • 1 more domain to complete (5/6 required)            │
│  • Assessment required before advancing                │
│                                                        │
│  [Schedule Assessment]                                 │
└────────────────────────────────────────────────────────┘
```

When eligible:
```
┌────────────────────────────────────────────────────────┐
│  ✓  READY TO ADVANCE TO YELLOW COMPETITIVE             │
│                                                        │
│  All requirements met.                                 │
│                                                        │
│  [Advance Level →]          (Director / Head Coach)    │
└────────────────────────────────────────────────────────┘
```

No mention of blocking_signal_types by name. "A load warning must be resolved first" not "overtraining_risk is blocking."

### Curriculum History (collapsed, "Show history" toggle)
Timeline of level advancements. Date, from level, to level, advanced by.

---

## Tab 3: Development

**Visible to:** Director, Head Coach, Coach  
**Purpose:** Technical progress over time — how are assessment scores trending?

### Assessment Radar (director + coach)
8-axis radar: current assessment in lime, previous in muted grey. Axes use plain domain names (Preparation, Downswing, Contact, Finish, Transition, Movement, Decision Making, Competition Behavior).

No raw scores on the radar — just the shape. Director can hover to see exact dimension scores. Coach sees the shape only.

### Progress Trend (simplified sparkline)
Single line: overall trend, last 90 days. Label: "Improving ↑" / "Stable →" / "Needs attention ↓" — not a score number for coaches.

Directors see the numeric score alongside the trend.

### Assessment History (table — director + head coach only)
Date | Overall | Trend | Coach | Status

Coach sees: Date | Summary | Next due

### Next Assessment
```
Assessment due:  In 4 days             [Schedule →]
Last assessment: 24 April 2026
```
Red if overdue. Lime if within 7 days. Muted grey if on track.

---

## Tab 4: Competition

**Visible to:** Director, Head Coach, Coach (read-only for Coach)  
**Purpose:** How is this player performing against external standards?

### UTR Card
```
UTR  4.2 ↑

12-month high: 4.6    12-month low: 3.8
```
Simple. No chart unless expanded. Director can expand to see full UTR history chart.

### Benchmark Status
Human language only. No "benchmark_below_expectation" labels.

```
vs. Green Performance peers:
  ● On track — matching expected development
  ▼ Competition results slightly below peers    ← was: benchmark_below_expectation
```

### Recent Results (last 5 matches)
Date | Opponent UTR | Result | Score
Simple table. Win = lime text. Loss = muted.

### Upcoming Competitions
Next 3 tournaments. Date + name only.

### Peer Comparison (Director + Head Coach only)
```
vs. similar players (UTR 4.0–4.5, Green Performance):
  Development score:  above average
  Competition results: slightly below
```
No cohort IDs, no percentile numbers. Plain comparison sentence.

---

## Tab 5: Signals + Watch List

**Visible to:** Director only  
**Tab name for Director:** "Watch List"  
**Purpose:** System-generated flags that need director awareness.

This tab uses slightly more technical language for the director — they understand the system. But still no raw signal_type enum values. Human-readable names only.

### Active Flags (was: active signals)
```
  Load warning            High    Active 3 days     [Resolve ↓]
  Assessment overdue      Medium  Active 19 days    [Schedule →]
  Competition results     Low     Active 7 days     [View →]
  dipped
```

Each flag: human name, level (high/medium/low), days active, action CTA.
Resolve → note input. Director records what was done.

### Focus Areas (was: player_priorities)
Ranked 1–5. Plain English labels.
Director only sees this. Connects to recommendations below.

---

## Tab 6: What to Do Next

**Visible to:** Director, Head Coach  
**Tab name:** "What to Do Next" (was: Recommendations)  
**Purpose:** Approve or override the engine's suggested development actions.

### Recommendation cards

```
┌────────────────────────────────────────────────────────┐
│  Downswing — Topspin Under Pressure                    │
│                                                        │
│  Confidence: High   Urgency: This week                 │
│                                                        │
│  The engine suggests focusing on swing path mechanics  │
│  under pace. Marcus has improved rallying but loses    │
│  topspin on fast balls — identified across 3 sessions. │
│                                                        │
│  Suggested drills:                                     │
│  • Swing Path Ladder (20 min)                          │
│  • High Ball Topspin Rally (15 min)                    │
│                                                        │
│  [✓ Approve]                    [Override with note]   │
└────────────────────────────────────────────────────────┘
```

Language rules for this tab:
- "Confidence: High / Medium / Low" — not a percentage
- "Urgency: Today / This week / This month" — not immediate/urgent/high/monitor
- Reasoning shown as a readable sentence — not JSONB field names
- "Identified across 3 sessions" not "3 outcome events recorded"

Override → text field: "Why are you changing this?" (required, logged)

---

## Tab 7: Outcomes

**Visible to:** Director, Head Coach, Coach  
**Purpose:** What actually happened in sessions? Is progress being made?

### Recent Activity (timeline)
```
28 Apr   Downswing drill       Marcus improved swing path  ●  Positive
26 Apr   Rally consistency     Error rate high on fast balls  ○  Needs work
24 Apr   Match play            Good decision-making on short balls  ●  Positive
```

"Positive" in lime. "Needs work" in orange. "Neutral" in muted. No verdict enum values.

### 30-Day Summary
```
Progress rate:  68% positive outcomes
Sessions logged:  9
```

No "verdict" labels. "Progress rate" replaces "positive outcome rate."

---

## Tab 8: Load + Fitness

**Visible to:** Director, Head Coach, Coach  
**Purpose:** Is this player physically ready to train? Any load concerns?

### Load Status (top, clear and simple)
```
Load this week:  High
Recommendation:  Ease intensity — reduce volume by 20% today
```

Not: "fatigue_risk_score: 0.74 — threshold: 0.70 exceeded."

### 28-Day Load Chart
Line chart, lime on dark. X-axis: weeks. No raw numbers on Y-axis — three zones labeled: "Normal", "High", "Too High". The current week's bar highlighted.

### Recovery Profile (plain language summary)
```
Recovery:     Moderate
Sensitivity:  Responds better to shorter, high-quality sessions
              than long high-volume training blocks
```
Derived from `player_behavior_profiles`. Never shows raw field names or 0–1 values.

**Director only:** Expands to show load_adjustment_factor and fatigue_sensitivity values.

---

## Tab 9: Notes + Comms

**Visible to:** Director, Head Coach, Coach (own notes only for Coach)  
**Purpose:** What has been said about this player? What's been sent to the parent?

### Coach Notes (feed)
Chronological. Each note: date, coach name, text.
- Director + Head Coach: see all notes
- Coach: see own notes + any note marked "share with team"
- "Flag for parent" toggle — marks note as source for next parent message

### Messages Sent (below notes, collapsed by default)
"Show sent messages ↓" toggle reveals:
- Messages sent to player (with plain excerpt)
- Messages sent to parent (with plain excerpt)
- Date, tone icon (not tone label), sent by

### Compose (sticky at bottom of tab)
```
[🎙 Voice note]          [✎ Write note]          [📤 Send update]
```
- Voice note → transcribed and saved as coach observation
- Write note → text input
- Send update → opens compose panel with audience selector (Player / Parent / Both) and preview

---

## Director-only: Full 9-tab view summary

| # | Tab name | Coach sees | Director sees |
|---|---|---|---|
| 1 | Today's Focus | ✓ Full | ✓ Full |
| 2 | Curriculum | ✓ Full | ✓ Full + failure patterns |
| 3 | Development | ✓ Simplified | ✓ Full with scores |
| 4 | Competition | ✓ Full | ✓ Full + peer comparison |
| 5 | Watch List | ✗ | ✓ Full |
| 6 | What to Do Next | ✗ | ✓ Full + approve/override |
| 7 | Outcomes | ✓ Full | ✓ Full |
| 8 | Load + Fitness | ✓ Full | ✓ Full + raw values |
| 9 | Notes + Comms | ✓ Own notes | ✓ All notes |

Head Coach sees tabs 1–4, 6, 7, 8, 9 (all except Watch List — they don't resolve signals, Director does).
