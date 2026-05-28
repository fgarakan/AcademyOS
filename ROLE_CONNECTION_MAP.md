# Role Connection Map

## Hierarchy

```
┌─────────────────────────────────────────────────────┐
│  DIRECTOR           Command Center                   │
│  Sees everything. Approves everything. Controls all. │
└──────────────────────────┬──────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ↓               ↓               ↓
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   COACH     │ │   PLAYER    │ │   PARENT    │
    │  Execution  │ │ Motivation  │ │   Trust     │
    └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Director

**Surfaces:** Director Dashboard (command center), full Player Profile, Intelligence, Configuration, Reports  
**Primary question the UI answers:** "What does my academy need from me right now?"

### Full access — can see and do everything:
- All player profiles (every tab, every field)
- All signals, priorities, recommendations (resolve, approve, override)
- Advance player curriculum levels (all stages including Yellow + HP)
- Apply, rollback, or create director configurations (weight sets + thresholds)
- Approve AI-proposed weight adjustments from the data flywheel
- View model performance, evaluation runs, version history
- Configure signal weights, urgency thresholds, load limits
- Access all coach notes academy-wide
- Manage staff accounts, groups, and player assignments
- Export longitudinal reports
- Approve voice-command proposed actions

### Director-exclusive surfaces:
- Director Dashboard (the command center — not accessible by any other role)
- Intelligence → Flywheel Insights
- Intelligence → Model Performance
- Configuration → Signal Weights / Thresholds / Director Configurations
- Staff Management

### Key daily flows:
1. **Morning review:** Open Director Dashboard → scan urgent alerts → action approval queue → check stuck players
2. **Curriculum advancement:** Advancement candidates card → review eligibility → one-click advance
3. **Recommendation oversight:** Recommendation queue → review AI output → approve or override with note
4. **Weight tuning:** Flywheel insight → review proposed config → apply or discard
5. **Coach oversight:** Coach execution panel → see which coaches have unlogged sessions

---

## Head Coach

**Surfaces:** Coach Workspace, full Player Profile (own players), Sessions, Voice AI  
**Primary question the UI answers:** "What do I need to do today?"

### Can do everything a Coach can, plus:
- Approve recommendations (not just view)
- Advance player levels (Red, Orange, Green stages)
- Override AI recommendations with a recorded reason
- View and action all active signals for own players
- Access all coach notes for own players (including other coaches' public notes)
- Resolve signals for own players

### Head Coach surfaces (extra vs Coach):
- Recommendation Review (approve / override controls visible)
- Level Advancement card in Player Profile
- Signal resolve button

---

## Coach

**Surfaces:** Coach Workspace (own players only), Live Sessions, Voice AI, Exercise Library  
**Primary question the UI answers:** "What do I deliver today and what do I record after?"

### Can do:
- View assigned player profiles — full development view, no configuration access
- Record outcomes, coach notes, and voice notes
- Use Voice AI to create sessions, templates, and notes
- View active signals and priorities (read-only — cannot resolve or approve)
- Start and run live sessions with attendance and block logging
- Mark session blocks complete
- Record post-session outcomes per player per exercise
- View drill recommendations (read-only)

### Cannot do:
- Approve or override recommendations
- Advance player curriculum levels
- View other coaches' players
- Access Director Intelligence or configuration
- View parent communication queue (can compose parent-flagged messages)

### Key daily flows:
1. **Pre-session:** Coach Workspace → Today's plan → open session → review player focus areas
2. **During session:** Live Session → mark attendance → block-by-block delivery → record observations via voice
3. **Post-session:** Log outcomes per player → system triggers domain progress updates
4. **Between sessions:** Review player focus areas → note signals → prepare next session

---

## Player

**Surfaces:** Player App (own data, filtered)  
**Primary question the UI answers:** "What am I working on and how am I doing?"

### Sees (simplified, encouraging):
- Current curriculum stage + level (display name only, no raw data)
- Domain progress as a visual completion bar (not outcome counts)
- Today's session focus (from coaching message or session plan)
- Recent wins and milestones (positive outcomes surfaced as achievements)
- Next goal (next mastery target)
- Optional homework / what to practice
- Own competition results and UTR (if applicable)
- Messages addressed to them (coach-to-player coaching messages only)

### Does NOT see:
- Signals, priorities, engine scores, urgency labels
- Predictions, injury risk, behavioral profiles
- Recommendation reasoning or AI logic
- Coach-only weakness analysis
- Load data or fatigue scores
- Other players' data
- Raw outcome counts or domain percentages

### Visual language for players:
- Progress shown as: stage badges, domain completion rings, milestone cards
- Language: encouraging, specific, forward-looking
- No negative framing — "building" not "failing", "developing" not "struggling"

---

## Parent

**Surfaces:** Parent App (own child only, heavily filtered)  
**Primary question the UI answers:** "Is my child progressing and do I understand what's happening?"

### Sees (plain language only):
- Child's current curriculum level with plain-language description ("what we're working on")
- Domain progress as simple status labels (Working On / Developing / Strong)
- Recent wins (milestone notifications, positive outcome highlights)
- Coach-approved update messages (coaching_messages with audience='parent' and is_sent=true)
- Upcoming session schedule (date + time only)
- Competition results and next tournament
- "What you can do at home" section (from parent_level_descriptions)

### Does NOT see:
- Signals, priorities, scores, urgency
- Assessment raw scores (summary level only: "developing well", "strong progress")
- Predictions or injury risk data
- Load or fatigue details
- Coach notes (only messages explicitly sent to parent)
- Other players' data
- Internal recommendation reasoning

### Visual language for parents:
- Progress shown as: stage badge, simple domain tiles (not percentages)
- Language: reassuring, collaborative, jargon-free
- Updates framed as: "Here's what [name] is focused on" not "weakness detected"

---

## Cross-Role Interaction Table

| Action | Initiates | Approves | System does | Who sees result |
|---|---|---|---|---|
| Voice command | Coach / Director | Director / Head Coach | `execute_approved_action()` | Staff |
| Record outcome | Coach | — (automatic) | `evaluate_curriculum_domain_progress()` | Director, Coach |
| Level advancement | Director / Head Coach | Director (Yellow/HP) | `advance_player_level()` | All roles (filtered) |
| Recommendation created | Engine (nightly) | Director / Head Coach | Persisted in recommendations | Director, Coach |
| Recommendation override | Head Coach / Director | — (self-approved) | `recommendation_overrides` | Director |
| Parent message sent | Coach | Coach (explicit send) | `coaching_messages` audience=parent | Parent |
| Player message sent | Coach | Coach | `coaching_messages` audience=player | Player |
| Weight adjustment applied | Director | — (self-approved) | `apply_director_configuration()` | Director |
| Benchmark result | Engine (nightly) | — | `player_benchmark_results` | Director, Coach |
| Curriculum signal emitted | Engine | — | `player_development_signals` | Director, Coach |
