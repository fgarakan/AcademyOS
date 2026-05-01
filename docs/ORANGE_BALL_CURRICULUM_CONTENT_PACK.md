# Orange Ball Curriculum Content Pack V1

**Sprint:** 54
**Date:** 2026-05-01
**Migration:** `supabase/migrations/046_orange_ball_content_pack.sql`

---

## Purpose

Seed the first real curriculum content pack for Orange Ball development levels:
- **Orange 1 — Rally** (stage: orange_development, level_number: 1)
- **Orange 2 — Direction** (stage: orange_development, level_number: 2)
- **Orange 3 — Construction** (stage: orange_development, level_number: 3)

All content is `source_type = 'global_default'` with `academy_id = NULL`.

---

## Content Counts

| Level | Drills/Skills | Games | Assessments | Total |
|---|---|---|---|---|
| Orange 1 — Rally | 4 | 3 | 2 | 9 |
| Orange 2 — Direction | 5 | 3 | 2 | 10 |
| Orange 3 — Construction | 4 | 4 | 2 | 10 |
| **Total** | **13** | **10** | **6** | **29** |

---

## Orange 1 — Rally

**Development focus:** Consistent contact, cooperation, ready position, recovery basics.

### Drills / Skills

| Title | Type | Pathway | Duration | Key Success Criteria |
|---|---|---|---|---|
| Ready Position and Split Step | skill | skill | 8–12 min | 7/10 visible split steps, weight forward, racket ready |
| Cooperative Crosscourt Baseline Rally | drill | skill | 10–15 min | 5+ ball crosscourt rally consistently |
| Recovery Bounce After Every Shot | drill | fitness | 8–10 min | Visible recovery move after 8/10 shots |
| Grip Organisation FH to BH Switch | skill | skill | 6–10 min | Grip change without looking, no prompting |

### Games

| Title | Type | Pathway | Duration | Description |
|---|---|---|---|---|
| Longest Rally Challenge | game | mixed | 10–15 min | Cooperative — reach and beat the longest rally |
| Mini-Set with Scoring Practice | game | competition | 15–20 min | Scoring practice in real game format |
| Target Zone Rally Game | game | mixed | 10–15 min | Land in designated zones cooperatively |

### Assessments

| Title | Type | Pathway | Duration | Pass Criteria |
|---|---|---|---|---|
| 5-Ball Rally Consistency Assessment | assessment | skill | 8–10 min | 5+ ball rally on 2 of 10 attempts |
| Scoring Knowledge Assessment | assessment | competition | 10–12 min | Correct score on 8/10 points self-sufficiently |

---

## Orange 2 — Direction

**Development focus:** Crosscourt forehand, down-the-line backhand, serve reliability, lateral footwork.

### Drills / Skills

| Title | Type | Pathway | Duration | Key Success Criteria |
|---|---|---|---|---|
| Crosscourt Forehand Direction Drill | drill | skill | 10–12 min | 6/10 FH shots land crosscourt in target zone |
| Down-the-Line Backhand Direction Drill | drill | skill | 10–12 min | 5/10 BH shots land DTL in target zone |
| Serve Into the Box — 10 Serves | drill | skill | 10–15 min | 6/10 first serves land in correct box |
| Lateral Coverage and Wide Ball Recovery | drill | fitness | 10–12 min | Lateral footwork (not reaching) on 7/10 wide balls |
| Directional Rally Under Constraint | drill | skill | 10–12 min | 5-ball crosscourt constrained rally at least twice |

### Games

| Title | Type | Pathway | Duration | Description |
|---|---|---|---|---|
| Direction Battle Points | game | competition | 15–20 min | Bonus points for using correct direction in live points |
| Serve-Score Game | game | competition | 15–20 min | First serves tracked in real game conditions |
| Crosscourt King / Queen | game | mixed | 15–20 min | Points scored only via crosscourt winner |

### Assessments

| Title | Type | Pathway | Duration | Pass Criteria |
|---|---|---|---|---|
| Directional Control Assessment | assessment | skill | 12–15 min | 6/10 FH crosscourt + 5/10 BH DTL |
| Serve Reliability Assessment | assessment | skill | 10–12 min | 6/10 serves each side (deuce + ad) |

---

## Orange 3 — Construction

**Development focus:** 3-shot patterns, technique under pressure, serve placement, defence-to-offence, point construction.

### Drills / Skills

| Title | Type | Pathway | Duration | Key Success Criteria |
|---|---|---|---|---|
| Three-Shot Pattern Drill | drill | skill | 12–15 min | Pattern completed with intent on 5/10 attempts |
| Technique Under Pressure Rally | drill | skill | 12–15 min | Technique holds through 5/8 coop-to-comp transitions |
| Serve Placement Targets — Deuce and Ad | drill | skill | 12–15 min | 5/10 serves hit called target zone each side |
| Defence to Attack Transition Drill | drill | mixed | 12–15 min | 4/10 successful attack sequences from defence |

### Games

| Title | Type | Pathway | Duration | Description |
|---|---|---|---|---|
| Build the Point Game | game | competition | 15–20 min | Points scored only via 3-shot construction |
| Offensive Pattern vs Baseline Defender | game | competition | 15–20 min | Attacker uses patterns vs recovering defender |
| Short Ball Attack Game | game | mixed | 15–20 min | Recognise and attack short balls — bonus points |
| Internal Challenge Match — Orange 3 Format | game | competition | 30–45 min | Internal match with coach observation for multiple requirements |

### Assessments

| Title | Type | Pathway | Duration | Pass Criteria |
|---|---|---|---|---|
| Three-Shot Pattern Observation | assessment | skill | 20–30 min | One intentional pattern observed across 2 sessions |
| Serve Placement Observation | assessment | skill | 12–15 min | 5/10 serves land in called target zone each side |

---

## Block Type → Content Type Mapping (Code-side)

| Block Type | Primary Content Types |
|---|---|
| warm_up | warmup, drill (fitness/movement) |
| technical | drill, skill |
| tactical | game, drill, tactical |
| movement | drill (fitness), warmup |
| fitness | drill (fitness) |
| competition | game, assessment, competition |
| mental | game |
| cool_down | cooldown |
| free | all types |

---

## Quality Notes

- All content is tennis-development appropriate for Orange Ball age/skill range (approx. 9–12 years, UTR 1.5–3.5)
- Descriptions and cues use plain English accessible to coaches and advanced players
- Parent-safe names avoid jargon (e.g., "Crosscourt King / Queen" → "Crosscourt Challenge Game")
- All assessments have `is_assessment_moment = true` — they can generate evidence for requirement progress
- Idempotent seed: safe to re-run migration, ON CONFLICT DO NOTHING on partial unique index

---

## Next Steps

- Sprint 55: Map content items to Orange Ball requirements (content-to-requirement mappings seed)
- Sprint 56: Curriculum-aware template block population action uses this content pack
- Sprint 57: Director can tag a template with its curriculum level to trigger population
