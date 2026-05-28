# Build Order

## Principle

Build the hierarchy top-down. The Director Dashboard is the most complex and most valuable screen — build it last, when its components are stable. Build foundations first, then assemble.

**Stack:**
- Framework: Next.js 14 (App Router)
- Database: Supabase (PostgreSQL + Auth + Realtime)
- Styling: Tailwind CSS — custom design tokens (dark, lime accent)
- Components: shadcn/ui (radix primitives) + custom card system
- Charts: Recharts (dark theme)
- Voice: Web Speech API → server action → Supabase RPC
- Types: `src/lib/supabase/database.types.ts` (complete, covers all 38 migrations)
- Auth: Supabase Auth → middleware role-routing

**Design tokens (set up in Phase 0):**
```css
--bg-base:    #0A0A0A;
--bg-surface: #111111;
--bg-elevated:#1A1A1A;
--border:     #222222;
--accent:     #C8FF00;
--text-primary: #FFFFFF;
--text-muted:   #555555;
--urgent:     #FF3B30;
--warning:    #FF9500;
--success:    #30D158;
```

---

## Phase 0: Foundation (Day 1–3)

No screens. All infrastructure.

| Task | Detail |
|---|---|
| Design token setup | Tailwind config with all custom tokens above |
| Component library | Card, Badge, Button, Avatar, Sparkline, ProgressBar, Modal base components |
| Auth flow | Login screen + Supabase Auth + middleware role-router |
| Role-routing | Director → `/director`, Coach → `/coach`, Player → `/player`, Parent → `/parent` |
| Supabase client | `client.ts`, `server.ts`, `database.types.ts` imported |
| Layout shells | Sidebar layout (Director), Bottom tab layout (Coach/Player/Parent) |

**Output:** Nothing the user can navigate yet. But every screen after this is just filling in components.

---

## Phase 1: Player Profile — Data Object (Day 4–8)

The Player Profile powers every other screen. Build it first — fully — so everything that follows can link to it.

**Build tabs in this order (each depends on the previous for component reuse):**

| Tab | Data query | Complexity |
|---|---|---|
| Header bar | `players`, `decision_scores`, `player_utr_profiles`, `player_curriculum_states` | Low |
| Tab 8: Load + Fitness | `player_load_aggregation`, `player_behavior_profiles` | Low |
| Tab 3: Skill Path | `assessments` (list + radar) | Medium |
| Tab 2: Curriculum | `player_curriculum_states`, `player_domain_progress`, `skill_progressions`, `progression_rules` | Medium |
| Tab 7: Outcomes | `player_outcomes` (timeline) | Low |
| Tab 5: Signals + Priorities | `player_development_signals`, `player_priorities` | Low |
| Tab 6: Recommendations | `player_recommendations`, `recommendation_reasoning` | Medium |
| Tab 4: Competition | `player_utr_history`, `player_benchmark_results`, `cohort_stats` | Medium |
| Tab 1: Overview | Aggregates from all other tabs | Medium |
| Tab 9: Notes + Comms | `coach_observations`, `coaching_messages` | Medium |

**Role filtering:** Apply access rules per tab during build (not after).

**Output:** Fully navigable Player Profile. Every role can open a player and see their permitted view.

---

## Phase 2: Coach Workspace (Day 9–13)

Coach is the primary daily user. Build the execution layer next.

| Screen | Data | Complexity |
|---|---|---|
| C1: Coach Home (workspace) | Players list with urgency sort, today's sessions, load warnings | Medium |
| C3: Live Session | Session attendance, block completion, outcome recording per player | High |
| C4: Post-Session Summary | Outcome review, submit | Medium |
| C5: Voice AI | Web Speech API, proposed action card, approve/reject | High |
| C2: Coach → Player Profile | Already built in Phase 1, just apply Coach role filter | Low |

**Key interaction to validate:** Record outcome → domain progress updates → player profile updates in real time (Supabase Realtime subscription on `player_domain_progress`).

**Output:** Coach can run a full session end-to-end: open workspace → open session → deliver blocks → record outcomes → post-session summary → voice command.

---

## Phase 3: Player + Parent Apps (Day 14–17)

Simple views. Fast to build because the data is already shaped.

**Player screens:**

| Screen | Data | Complexity |
|---|---|---|
| P1: Player Home | `player_curriculum_states`, `player_domain_progress`, `coaching_messages` | Low |
| P2: Player Progress | `player_domain_progress` (simplified labels) | Low |
| P3: Player Wins | `player_curriculum_history`, `player_domain_progress` (mastered_at) | Low |
| P4: Player Messages | `coaching_messages` (player audience) | Low |

**Parent screens:**

| Screen | Data | Complexity |
|---|---|---|
| PA1: Parent Home | `player_curriculum_states`, `curriculum_stages`, `parent_level_descriptions` | Low |
| PA2: Parent Progress | `player_domain_progress` (status labels only), `parent_level_descriptions` | Low |
| PA3: Parent Wins | `player_curriculum_history`, `player_domain_progress` (mastered_at) | Low |
| PA4: Parent Updates | `coaching_messages` (parent audience, is_sent=true) | Low |

**Output:** Players and parents have working apps. The core product loop is functional.

---

## Phase 4: Director Dashboard (Day 18–24)

Now that Player Profile, Coach Workspace, and Player/Parent apps exist, the Director Dashboard assembles from components already built.

**Build card by card:**

| Card | Data | Complexity |
|---|---|---|
| Academy Vital Signs (4 metric cards) | `decision_scores`, `proposed_actions`, `player_curriculum_states`, `player_load_aggregation` | Low |
| Priority Queue | `v_academy_priority_queue` | Low |
| Alerts | `player_development_signals` GROUP BY type | Low |
| Curriculum Coverage bar chart | `player_curriculum_states` GROUP BY stage | Medium |
| Coach Activity | `sessions`, `session_blocks`, `profiles` | Medium |
| Competition card | `player_utr_history`, `player_benchmark_results`, `competition_schedule` | Low |
| Recommendation Queue | `player_recommendations` (counts) | Low |
| Cohort Insights | `cohort_stats`, `v_cohort_overview` | Low |
| Flywheel card | `flywheel_insights` | Low |
| System Health | `model_versions`, `model_evaluation_runs` | Low |
| Parent Comms Queue | `coaching_messages` (unsent, parent audience) | Low |

**Full director navigation after dashboard:**

| Screen | Complexity |
|---|---|
| D2: All Players list | Medium (table + filters + card toggle) |
| D4: Curriculum Stage Map | Medium |
| D5: Intelligence → Flywheel | Medium |
| D6: Configuration | High (editable weights, slider controls) |

**Output:** Director has the complete command center.

---

## Phase 5: Reports + Competition (Day 25–28)

| Screen | Complexity |
|---|---|
| Player Longitudinal Report | High |
| Academy Performance Report | High |
| Cohort Comparison Report | Medium |
| Competition Calendar | Medium |
| Benchmark Definitions management | Medium |
| UTR Academy Overview | Medium |

---

## Phase 6: Polish + QA (Day 29–30)

- Responsive audit (all screens on mobile + tablet + desktop)
- Role access audit (verify each role can only see what they should)
- Empty state design (new academy, new player, no data yet)
- Loading skeletons (dark with subtle pulse)
- Error states
- Notification system (bell → drawer with recent alerts)
- Supabase Realtime subscriptions: live session outcomes, priority queue score updates

---

## Build Timeline

| Phase | Days | What ships |
|---|---|---|
| 0 Foundation | 1–3 | Auth, design system, layout shells |
| 1 Player Profile | 4–8 | Full Player Profile (all 9 tabs, all 4 roles) |
| 2 Coach Workspace | 9–13 | Coach home, live session, voice AI |
| 3 Player + Parent | 14–17 | Player app (4 screens), Parent app (4 screens) |
| 4 Director Dashboard | 18–24 | Command center + director navigation |
| 5 Reports + Competition | 25–28 | Reporting + competition track |
| 6 Polish + QA | 29–30 | Responsive, access audit, empty states |
| **Total** | **30 days** | **~25 screens** |

---

## What Builds on What

```
Design System
  └── Component Library
      ├── Auth + Role Router
      │   ├── Layout Shells
      │   │   ├── PLAYER PROFILE  ← Phase 1 (everything references this)
      │   │   │   ├── Coach Workspace (Phase 2)
      │   │   │   ├── Player App (Phase 3)
      │   │   │   ├── Parent App (Phase 3)
      │   │   │   └── Director Dashboard (Phase 4 — assembles from above)
      │   │   └── Reports (Phase 5)
      │   └── Voice AI (Phase 2 — used across all coach screens)
      └── Realtime subscriptions (Phase 6)
```

**The Player Profile is built first because it is the source of truth every other surface references.**  
**The Director Dashboard is built last because it assembles every other surface's data into one view.**
