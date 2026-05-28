# Academy OS — Curriculum Master Spine

**Version:** 1.0
**Created:** 2026-05-02
**Status:** ACTIVE — source of truth for all curriculum features
**Product decision:** Product-agnostic. See `docs/curriculum/product-tool-exclusion-decision.md`
**Synthesis reference:** `docs/curriculum/angles-curriculum-synthesis.md`

---

## How to Read This Document

This is the product-agnostic 15-stage curriculum spine for Academy OS. It is the canonical reference for:
- Every curriculum feature in the app
- AI suggestion engine context injection (one stage section per query)
- Coach and director understanding of stage expectations
- Data model and seed pack verification

**What it contains.** One section per stage. Each section covers: volume band, technical focus, tactical vocabulary active at that stage, movement priorities, competition context, mentality focus, the coach's 4-phrase language (Doing Well / Working On / Current Focus / Next Step), the exact gate criteria a player must meet to advance, and any critical or high-severity failure mode alerts.

**What it does not contain.** No product tools. No device cadence. No app-specific assessments. No `[PROPOSED:]` content. Every gate is evaluable by direct coach observation using standard tennis equipment.

**Who it is for.** Any working tennis coach should be able to read a stage section and understand what to coach, how to talk about it, and what evidence is needed for promotion — without any other reference.

**Source of truth hierarchy.**
1. Gates → `AOS_Curriculum_Gates.xlsx` Gate Library (exact IDs, thresholds preserved here)
2. Stage descriptions → `AOS_Curriculum_Matrix.xlsx` Matrix sheet
3. Tactical vocabulary → `AOS_Curriculum_Tactics.xlsx`
4. Coach language → `AOS_Curriculum_CoachLanguage.xlsx` Coach Language (Long)
5. Volume → `AOS_Curriculum_Volume.xlsx` Volume Progression

If this document conflicts with a source file, the source file wins. Update this document to match.

---

## Stage Naming Convention

The curriculum is organized as **5 color bands × 3 sub-stages = 15 stages.**

| Band | Stage 1 | Stage 2 | Stage 3 |
|---|---|---|---|
| **Red** | Red 1 | Red 2 | Red 3 |
| **Orange** | Orange 1 | Orange 2 | Orange 3 |
| **Green** | Green 1 | Green 2 | Green 3 |
| **Yellow** | Yellow 1 | Yellow 2 | Yellow 3 |
| **High Performance** | HP 1 | HP 2 | HP 3 |

**Color band meaning.** Ball color corresponds to equipment compression used at that band — Red (25%), Orange (50%), Green (75%), Yellow (100% / standard). HP uses standard ball on full court with professional-level training volume and periodization.

**Sub-stage meaning.**
- **.1 Foundation** — introduces the vocabulary, tools, and physical competencies of the new band. Learning happens under coach guidance and feed conditions.
- **.2 Intermediate** — consolidation under live pressure. Player executes the band's competencies in peer play and low-stakes competition. Tactical vocabulary is active.
- **.3 Matchplay** — competition application. Player uses the full band toolkit in sanctioned match play and structured events. Gate criteria at this sub-stage include competition results, not just drill execution.

**Promotion is evidence-based, not time-served.** Typical stage duration is a guide (6–12 months for most stages). A player who meets all gate criteria in four months advances. A player who takes 18 months consolidating is not behind.

---

## The Dual Track Model

Every player has two simultaneous stage positions:

**Skill Track** — where the player is in the 15-stage technical, tactical, movement, and mentality developmental spine. This is the primary record.

**Competition Track** — where the player is in competitive maturity: match format, scoring exposure, opponent pool, tournament cadence, and competitive behavior readiness. This advances independently from the Skill Track.

A player can be technically at Green 2 and competitively only at Orange 3. Both positions are tracked, displayed, and gated separately in AOS. Convergence is expected but not required — the curriculum supports players who develop unevenly across the two tracks.

**Fitness Path** — a parallel off-court development architecture (Physical Literacy → Athletic Foundation → Sport Performance → High Performance) that supports both tracks. Fitness is not a gate on Skill Track promotion except at specific HP-band transitions where physical preparation evidence is required.

**AI suggestions recommend, they do not execute.** All AI-generated coaching suggestions, session recaps, and promotion proposals flow through the `proposed_actions` pipeline. A director or head coach must approve before any player record change is executed.

---

## Tactical Vocabulary Reference

The following six zones are the locked tactical vocabulary of the entire curriculum. Every coach, player, and parent communication uses these exact terms. Do not invent alternate zone names in the app.

| Zone | Where on court | Use case | Introduces at |
|---|---|---|---|
| **Middle** | Deep and central — 1m inside the baseline, centered between singles sidelines | The default rally ball. Neutralizes angles. Resets rallies. When in doubt, middle. | Red 3 (vocabulary) → Orange 1 (target zone) |
| **Crosscourt** | Diagonal direction — FH to FH, or BH to BH. Deep, past the service line | The primary rally setup direction. Longer court, lower net. The setup for patterns. | Orange 1 (vocabulary) → Orange 2 (executed in rally) |
| **Short Angle** | Sharp diagonal landing inside the service box near the sideline | Opens the court. Sets up the next ball into the open space. Setup, not finish. | Green 2 (concept) → Yellow 1 (executed in pattern) |
| **Line** | Straight down the sideline | The change of direction. Higher risk than crosscourt. Used after setting up with crosscourt. | Green 1 (vocabulary) → Green 2 (executed in pattern) |
| **Transition** | The midcourt — between service line and baseline, player has moved forward | The "act now" zone. Short ball trigger: recognize and attack, or concede the advantage. | Green 1 (named) → Green 2 (acted on) → Yellow 1 (reliable) |
| **Endgame** | At net, or opponent is out of position / off-court | Close the point. Placement over power. Composure over creativity. | Green 2 (named) → Green 3 (executed) → Yellow 1 (consistent) |

**The bisector principle.** After every shot, recover to the midpoint of the opponent's available angles. This principle is introduced as coached vocabulary at Orange 2, becomes a gate at Orange 3, and is the expected default in match play from Green 2 onward. Validated by 2024 peer-reviewed research (Hawk-Eye / Scientific Reports).

---

## Stage Sections

---

### Red 1 — Foundation

> *First contact. Athletic foundation. Multi-sport. Joy and engagement.*

**Volume band:** 1.5–3 hrs/week · 1–2 sessions · 45–60 min sessions
**Typical stage duration:** 6–12 months

**Technical:** First contact with the racquet. Goals are tracking a slow ball, throwing and catching underhand and overhand, striking a stationary ball, and developing racquet face awareness. The swing does not need to be a tennis swing yet — the priority is contact and coordination. Intention at this stage: get the ball back in any direction.

**Tactical:** The court is a playground, not a tactical board. Vocabulary is spatial only: "your side / their side," "close to net / far from net." No zone vocabulary yet. No decision tree. Cooperative rally games with personal-best framing ("how many can you catch?").

**Movement:** Fundamental movement skills (FMS) over tennis-specific footwork. Walking, running, skipping, hopping, jumping, galloping, animal walks. Tracking a moving object. Athletic foundation before tennis foundation.

**Competition:** Cooperative rally games with the coach. No scoring against peers. "Beat the coach" personal-best framing. Tag games and target activities. Staying on the court and trying again is the only competition outcome that matters.

**Mentality:** Listening to a coach for 30–60 seconds. Taking turns. Trying again after a miss. First exposure to the idea that effort is the success metric, not outcome.

**Coach says — Technical:**
- Doing Well: Tracking the ball with eyes and stepping toward it.
- Working On: Holding the racquet in one consistent grip during a rally.
- Current Focus: Letting the racquet swing through the contact, not stop at the ball.
- Next Step: Adding a small turn of the shoulders before the swing.

**Gates to advance — Red 1 → Red 2:**
- [ ] `RED1__RED2__01` — Movement/Athletic: Demonstrates basic catching and throwing competence. Threshold: Catches 7/10 underhand tosses from 3m; throws into 1m hoop 5/10 from 3m.
- [ ] `RED1__RED2__02` — Technical: Holds racquet correctly and contacts a stationary ball. Threshold: Recognizable grip + clean contact in 5/10 attempts.
- [ ] `RED1__RED2__03` — Mentality/Learning Behavior: Engages with peers in partner activities for full session block. Threshold: Sustained engagement 15 min × 3 sessions in a row.
- [ ] `RED1__RED2__04` — Mentality/Learning Behavior: Listens through a 60-second instruction without disengaging. Threshold: 60s sustained attention × 3 separate session attempts.

---

### Red 2 — Intermediate

> *Self-feed and rally with coach. Target zones. Modified scoring.*

**Volume band:** 2–4 hrs/week · 2–3 sessions · 45–60 min sessions
**Typical stage duration:** 6–12 months

**Technical:** Self-feed and rally with coach. Drop-hit to target zones. A recognizable swing shape is beginning to emerge — low-to-high path, contact in front. Players begin to serve the ball over a modified net with a stationary toss. The grip is becoming consistent.

**Tactical:** Target zones are physically marked (cones, lines). The vocabulary question is "where on the court did the ball land?" — not yet what to do with that information. Modified cooperative scoring ("how many in a row to the target?") introduces the counting habit without win/loss pressure.

**Movement:** Tennis-shaped FMS: side shuffles, split-step introduction ("bounce on coach contact"), ready position. Tracking a moving ball through a full arc. Lateral recovery steps introduced as a concept.

**Competition:** Mini-rally games with peers. Cooperative scoring. Modified scoring formats (first to 7, no deuce). Players begin to self-call "in / out" with coach supervision. Self-scoring a simple game is the primary competition skill at this stage.

**Mentality:** Bouncing back from a missed ball within the next shot. Cheering for partners. First introduction of the Working On concept — something is being practiced, not failing.

**Coach says — Technical:**
- Doing Well: Continental grip on serves and volleys, eastern on groundstrokes.
- Working On: Consistent unit-turn before forehand and backhand.
- Current Focus: Following through to the opposite shoulder.
- Next Step: Adding the left hand on the throat for backhand prep.

**Gates to advance — Red 2 → Red 3:**
- [ ] `RED2__RED3__01` — Technical: Drop-hit rally with coach to a target zone (3+ shots). Threshold: 3+ consecutive contacts to a target zone × 3 separate sessions.
- [ ] `RED2__RED3__02` — Technical: Serves the ball over the modified net. Threshold: 5/10 stationary serves clear net into the modified service box.
- [ ] `RED2__RED3__03` — Competition: Knows the score in a simple rally game. Threshold: Player can state the current score on demand × 3 sessions.
- [ ] `RED2__RED3__04` — Mentality/Learning Behavior: Plays a full game-block (10–15 min) with sustained attention. Threshold: 10–15 min × 3 separate sessions.

---

### Red 3 — Matchplay

> *Mini-rally with peers. Modified matches. First experience of structured competition.*

**Volume band:** 3–5 hrs/week · 3 sessions · 60 min sessions
**Typical stage duration:** 6–9 months

**Technical:** Recognizable forehand and backhand swing shape with movement. Drop-hit rally with peer. Modified serve with consistent toss. Volley concept introduced in fed drills. First-volley contact in front of the body.

**Tactical:** **Middle** enters as the first and only tactical concept. The decision tree is one-deep: aim deep and central. All shots aim middle until the vocabulary is locked in. Introducing "my side / their side" and "safe ball = deep middle."

**Active zones:** Middle (vocabulary stage — all shots aim here).

**Decision tree — Red 3:**
| Situation | Action | Why |
|---|---|---|
| Ball comes anywhere | Aim middle, deep | One-branch tree: middle is the entire vocabulary. No patterns yet. |

**Movement:** Split-step on opponent contact begins to be coached as a habit. Recovery to ready position after each shot. Lateral tracking introduced.

**Competition:** Modified red-ball matches with peers. Non-elimination round-robins. Players self-call "in / out" and begin to self-manage the score. First experience of a full 3-game match format. The gate to advance requires playing a full mini-match without composure breakdown.

**Mentality:** Handling a lost point without disengaging. Naming an emotion ("I'm frustrated"). First use of a one-word reset. Warm-up routine consolidated and repeatable.

**Coach says — Technical:**
- Doing Well: Topspin starting to appear on forehand under control.
- Working On: Backhand unit-turn with both hands for two-hand players.
- Current Focus: Serve toss out front and contact above shoulder.
- Next Step: First-volley contact in front of the body.

**Coach says — Tactical:**
- Doing Well: Three-shot patterns (e.g., crosscourt, crosscourt, line).
- Working On: Recognizing offense vs defense based on incoming ball depth.
- Current Focus: Stepping inside the baseline on a short ball.
- Next Step: Choosing to recover to the bisector after each shot.

**Gates to advance — Red 3 → Orange 1:**
- [ ] `RED3__ORANGE1__01` — Technical: Sustained mini-rally with peer (3+ shots in a row). Threshold: 3+ consecutive shots × 3 sessions, with at least 2 different peers.
- [ ] `RED3__ORANGE1__02` — Competition: Plays a full mini-match using modified scoring without coach intervention. Threshold: 1 full mini-match end-to-end × 2 separate occasions.
- [ ] `RED3__ORANGE1__03` — Technical: Recognizable forehand and backhand swing shape on video review. Threshold: Forehand AND backhand both pass shape check on slow-motion video review.
- [ ] `RED3__ORANGE1__04` — Mentality/Learning Behavior: Demonstrates basic sportsmanship behaviors in match context. Threshold: All of: calls own lines, handshake at end, no equipment-throwing or excessive negative reaction.

---

### Orange 1 — Foundation

> *Recognizable forehand and backhand. Crosscourt as a named target zone.*

**Volume band:** 4–6 hrs/week · 3–4 sessions · 60–75 min sessions
**Typical stage duration:** 6–9 months

**Technical:** Recognizable forehand and backhand groundstrokes with structure — unit turn, contact in front, follow-through to the opposite shoulder. Drop-hit and feed rallies are the primary practice format. Volley basics introduced in fed drills (5/10 over the net). Serve rhythm beginning to emerge as a repeatable sequence (toss, drop, contact).

**Tactical:** Court mapping vocabulary expands: **middle** and **crosscourt** are both named and targeted. The concept of "safe ball = deep middle, setup ball = crosscourt" is introduced. Crosscourt is not yet pattern-coupled — it is a named target zone, not yet a deliberate decision.

**Active zones:** Middle (target zone), Crosscourt (vocabulary introduced).

**Decision tree — Orange 1:**
| Situation | Action | Why |
|---|---|---|
| Ball comes anywhere | Aim middle (default) OR crosscourt (when comfortable) | Two-branch tree. Crosscourt is introduced as vocabulary but not yet pattern-coupled. |

**Common mistake:** Going for line shots. Line does not enter the decision tree until Green 1.

**Movement:** Tennis-specific footwork patterns: side shuffles between cones, recovery steps, split-step timed to coach contact. Open-stance forehand on wide balls beginning to emerge. Bisector recovery introduced as a concept (not yet a gate).

**Competition:** Modified Orange-ball matches on a 60-foot court (50% compression ball). Singles and doubles both introduced. Coach assigns matchups. The key competition development at this stage is completing a best-of-3 short-set format without composure breakdown.

**Mentality:** Sustaining focus across a 45–60 minute session. Coach-prompted self-assessment after each block. Beginning to name an emotion in the moment ("frustrated," "tired," "focused").

**Coach says — Technical:**
- Doing Well: Topspin forehand with full unit turn and finish.
- Working On: Two-hand backhand with both arms driving through.
- Current Focus: Serve with rhythm — toss, drop, contact in one motion.
- Next Step: Slice backhand introduction for control balls.

**Coach says — Tactical:**
- Doing Well: Crosscourt as default. Line shot is intentional, not random.
- Working On: First serve plus one (serve, then a forehand).
- Current Focus: Recognizing the short ball trigger and stepping in.
- Next Step: Defending the line with crosscourt recovery.

**Gates to advance — Orange 1 → Orange 2:**
- [ ] `ORANGE1__ORANGE2__01` — Technical: Reliable forehand and backhand under feed. Threshold: 7/10 land in court on each wing, fed from 3 feed positions.
- [ ] `ORANGE1__ORANGE2__02` — Tactical (Court Mapping): Can rally crosscourt with a peer (5+ shots) on at least one wing. Threshold: 5+ consecutive crosscourt shots × 3 sessions.
- [ ] `ORANGE1__ORANGE2__03` — Technical: Basic volley contact in a fed drill. Threshold: 5/10 fed volleys clear net and land in court.
- [ ] `ORANGE1__ORANGE2__04` — Competition: Plays Orange-ball matches with modified scoring and completes them independently. Threshold: Completes 3+ Orange-ball matches without coach intervention.

**Failure mode alerts:**
- FM-02 HIGH: Color-band label ("Orange 1") causes dignity injury for players entering at age 12+. AOS player-facing UI must suppress the color-band label when `entry_age > 12`. Surface sub-stage type only ("Foundation tier").
- FM-03 HIGH: Technical column at Orange 2 assumes prior Red-band exposure. Late developers entering at Orange 1 without Red background need extended session duration and reduced weekly volume ramp — not the standard Orange 1 → 2 timeline.
- FM-12 HIGH: Volume thresholds at Orange 1 are calibrated for color-band age groups. Late-start adult-adjacent players (A8) can physically handle more volume but need archetype-aware modifiers in the volume guidance. Standard ramp applies only to age-typical entrants.

---

### Orange 2 — Intermediate

> *Rallying with movement. Direction emerges. Bisector recovery introduced.*

**Volume band:** 5–7 hrs/week · 4 sessions · 60–75 min sessions
**Typical stage duration:** 6–9 months

**Technical:** Rallying with movement begins to consolidate. Direction emerges: the player can distinguish crosscourt from line as deliberate choices, not accidents. Volley as part of a point pattern (approach + volley) is introduced. Serve and return both used to start points reliably (60%+ in-rate).

**Tactical:** The **first real decision tree** activates: middle vs. crosscourt as a function of opponent position. From a neutral position, the default is crosscourt deep. From a defensive position, the answer is always middle deep. Bisector recovery is introduced as a coached habit — hit, then recover to the midpoint of the opponent's available angles.

**Active zones:** Middle (reset), Crosscourt (default rally direction, being executed in rally play).

**Decision tree — Orange 2:**
| Situation | Action | Why |
|---|---|---|
| Baseline, neutral | Crosscourt deep | Default rally direction. Crosscourt is the longer, lower-net option. |
| Baseline, defensive (pulled wide) | Middle, deep | When out of position, reset is always middle. Never try to escape with a line. |

**Common mistake:** Hitting line because crosscourt feels boring. Patience with crosscourt is the skill at this stage.

**Pattern in play:** ONE-TO-ONE (Crosscourt rally) — `X-X` — Both players hit crosscourt. Introduces at Orange 2.

**Movement:** Bisector recovery introduced as a coached habit. Open-stance forehand begins to emerge. Lateral shuffle for short distances, crossover step for wider balls. Forward movement to short-ball trigger beginning.

**Competition:** Singles and doubles formats both played weekly. Modified-scoring tournaments (first to 4, match tiebreak at 1-1). Players begin to articulate a "Current Focus" at session start and report on it at session end.

**Mentality:** Self-naming a Current Focus at the start of a session. The between-point reset and changeover reframe routines are introduced explicitly. Self-talk audit begins: what is the internal voice saying?

**Coach says — Technical:**
- Doing Well: Heavy topspin forehand on demand.
- Working On: Backhand depth under pressure.
- Current Focus: Serve toss consistency.
- Next Step: First-volley closing the angle.

**Coach says — Tactical:**
- Doing Well: Three-pattern game plan articulated before matches.
- Working On: Score-state awareness (4-2 vs 2-4).
- Current Focus: Approach + first volley as a planned pattern.
- Next Step: Identifying opponent's weaker side and exploiting it.

**Gates to advance — Orange 2 → Orange 3:**
- [ ] `ORANGE2__ORANGE3__01` — Technical: Sustained rally with movement (5+ shots) with a peer. Threshold: 5+ shots with movement × 3 sessions, 2+ peers.
- [ ] `ORANGE2__ORANGE3__02` — Technical: Serve and return start a point reliably. Threshold: 60%+ serve-in rate, 60%+ return-in rate on first attempts.
- [ ] `ORANGE2__ORANGE3__03` — Tactical (Court Mapping): Recognizes and names middle vs. crosscourt zones in live play. Threshold: Player can name the zone of incoming and outgoing balls in 8/10 attempts during a coached rally.
- [ ] `ORANGE2__ORANGE3__04` — Movement/Athletic: Bisector recovery is visible (not demanded) in coached rally drills. Threshold: Recovery toward middle observed in 3/5 rallies during a coached drill session × 3 sessions.

---

### Orange 3 — Matchplay

> *Sustained rallies under pressure. First repeatable patterns. Sanctioned events.*

**Volume band:** 6–8 hrs/week · 4–5 sessions · 75–90 min sessions
**Typical stage duration:** 6–9 months

**Technical:** Sustained rallies under pressure. Recognizable patterns beginning (one-to-one crosscourt). Serve with placement — first serve direction on demand. Approach + first volley combination as a unit. Slice backhand as a control or change-of-pace option.

**Tactical:** Crosscourt is the primary rally direction. **Line** is introduced as a "change-up" — not yet in the decision tree at baseline, but present in the Orange 3 vocabulary. The player can name a 5-pattern library and select patterns by score state and opponent style. Pattern execution can be counted in coached rally blocks — the first numeric tactical metric.

**Active zones:** Middle (reset), Crosscourt (pattern direction), Line (change-up, not yet in baseline decision tree).

**Decision tree — Orange 3:**
| Situation | Action | Why |
|---|---|---|
| Baseline, neutral | Crosscourt, then look for short ball | First repeatable pattern: cross-cross, looking for the ball that lands short. |
| Baseline, defensive | Middle, deep, recover | Middle is always the reset. Recovery to bisector is now expected in drill. |
| Inside baseline (short ball) | Crosscourt or middle (no line yet) | Player recognizes the short ball but line is not yet in the short-ball vocabulary. |

**Common mistake:** Not recognizing the short ball trigger when it comes. The trigger recognition is the skill at this stage.

**Pattern in play:** ONE-TO-ONE (`X-X`) consolidating through Orange 3.

**Movement:** Open-stance forehand under live pressure. Hit-recover-ready as a repeatable sequence in drill. Forward and backward movement to short and deep balls. Defensive sliding on hard court introduced.

**Competition:** Sanctioned Orange-ball events (where available). Players keep their own score and self-officiate. Pre-match routine introduced as a 5-minute predictable sequence. Between-point reset language becomes explicit: walk, breathe, reset.

**Mentality:** Pre-match routine introduced. Between-point reset and reframe routine. Body-language audit: composure must be visible to others. Cue word for high-pressure points.

**Coach says — Technical:**
- Doing Well: Forehand and backhand both reliable under pace.
- Working On: Serve with placement (first serve direction on demand).
- Current Focus: First-volley and approach combination.
- Next Step: Slice backhand as a control or change-of-pace shot.

**Coach says — Tactical:**
- Doing Well: Five-pattern library identified and named.
- Working On: Pattern selection based on score state and opponent style.
- Current Focus: Endgame patterns (closing volleys, overheads).
- Next Step: First-strike forehand off the serve.

**Gates to advance — Orange 3 → Green 1:**
- [ ] `ORANGE3__GREEN1__01` — Competition: Wins matches at Orange ball at appropriate competitive event. Threshold: ≥30% match-win rate at age-appropriate Orange-ball events over 12 weeks.
- [ ] `ORANGE3__GREEN1__02` — Tactical (Court Mapping): Demonstrates one repeatable pattern (e.g., crosscourt forehand setup). Threshold: Pattern executed in 3 of 5 rallies during a coached pattern drill × 2 sessions.
- [ ] `ORANGE3__GREEN1__03` — Mentality/Learning Behavior: Independent in basic match etiquette and scoring. Threshold: All of: serves correct side, knows score, makes own line calls, no coaching needed during a match.
- [ ] `ORANGE3__GREEN1__04` — Movement/Athletic: Bisector recovery is the default in drill. Threshold: Recovery toward bisector in 4/5 rallies during a coached drill session.

**Failure mode alerts:**
- FM-01 CRITICAL: The tactical gate at this transition (`ORANGE3__GREEN1__02`) must be a hard database block — it cannot be overridden by technical quality alone. A technically clean ball-striker who has not demonstrated a repeatable pattern must not advance to Green 1. Tactical evidence count is a blocking condition, not a tiebreaker.
- FM-06 HIGH: Recreation-oriented players (A4) may not generate the match volume required by gate `ORANGE3__GREEN1__01`. If the `recreation_flag` is set on the player record, the competition gate should be recalibrated to internal academy events only. Director must confirm this flag.

---

### Green 1 — Foundation

> *Full-court engagement. Spin emerges. All four major shots usable.*

**Volume band:** 7–10 hrs/week · 4–5 sessions · 75–90 min sessions
**Typical stage duration:** 6–9 months

**Technical:** Full-court engagement begins. Depth and direction control are the primary technical goals. Recognizable topspin on at least one wing (forehand). Approach-volley as a connected unit introduced in fed drills. Serve with two paces (heavier first serve, safer second serve) beginning to develop.

**Tactical:** The **full tactical vocabulary is now active**. All six zones — middle, crosscourt, short angle (concept), line (vocabulary), transition (named), endgame — enter the system at Green 1. Crosscourt remains the setup direction. Line is in vocabulary but not yet pattern-executed reliably.

**Active zones:** All six zones introduced. Line and Transition enter as vocabulary concepts at Green 1.

**Decision tree — Green 1:**
| Situation | Action | Why |
|---|---|---|
| Baseline, neutral | Crosscourt deep with topspin | Spin keeps the ball in and creates margin. Crosscourt is still the setup. |
| Baseline, defensive | Middle, deep, high (defensive moonball) | Defense = depth + height. Buys time. Do not hit low and flat under defense. |
| Inside baseline (short ball) | Approach + volley OR drive crosscourt | Approach-and-volley introduced as a unit. Approach quality determines volley quality. |

**Pattern in play:** ONE-TO-TWO (`X-X-Line`) — two crosscourt setups, then a line finish — introduces at Green 1.

**Movement:** Full-court coverage as a meta-skill. Multi-directional movement under live pressure. Defensive recovery from wide balls. Forward to net and back to baseline as a repeatable sequence.

**Competition:** Green-ball sanctioned events. Best-of-three short sets. Players manage scoring, officiating, and the pre-match routine independently. A 30%+ match-win rate over 12 weeks at age-appropriate Green-ball events is the first competition gate here.

**Mentality:** Pre-match routine player-owned. Between-point reset is becoming automatic. Self-coaching during a match (player identifies what to focus on without coach input). Body-language reset after a lost game.

**Coach says — Technical:**
- Doing Well: Topspin forehand and backhand with depth and pace.
- Working On: Serve with two paces (first serve heavy, second serve safe).
- Current Focus: Volley and overhead under match pressure.
- Next Step: Slice backhand and drop shot for variety.

**Coach says — Tactical:**
- Doing Well: Three-pattern game plan executed in matches.
- Working On: First-strike forehand identified and used.
- Current Focus: Approach + volley pattern available.
- Next Step: Defending and counter-attacking from stretched positions.

**Gates to advance — Green 1 → Green 2:**
- [ ] `GREEN1__GREEN2__01` — Technical: Reliable groundstrokes from full-court positions. Threshold: 7/10 land deep (past service line) on feed from baseline, both wings.
- [ ] `GREEN1__GREEN2__02` — Technical: Basic spin control on both wings (visible topspin). Threshold: Topspin clearly visible (ball arc + bounce behavior) in 6/10 contacts on each wing.
- [ ] `GREEN1__GREEN2__03` — Technical: Approach-volley as a recognized unit. Threshold: Executes approach-then-volley sequence in 3 of 5 attempts during a coached drill.
- [ ] `GREEN1__GREEN2__04` — Competition: Wins at least 30% of matches at Green-ball events over 12 weeks. Threshold: ≥30% win rate, age-appropriate Green-ball events.

**Failure mode alerts:**
- FM-08 CRITICAL: Every promotion decision at this stage and above requires an evidence citation paper trail linked to audit logs. A coach checkbox is not sufficient. Evidence must be recorded against specific gate criteria with timestamps and supporting observations. Director approval of all promotions must be logged.

---

### Green 2 — Intermediate

> *Three-shot patterns become technically reliable. Short-ball trigger active.*

**Volume band:** 9–12 hrs/week · 5 sessions · 90 min sessions
**Typical stage duration:** 6–9 months

**Technical:** Tactical patterns become technically reliable. Spin variation is deliberate — topspin for depth, slice for control and change of pace. All four major shots (forehand, backhand, serve, return) are usable as weapons or at minimum as reliable neutralizers. Serve with placement and pace beginning to differentiate.

**Tactical:** Three-shot patterns are the tactical core of Green 2: ONE-TO-ONE (`X-X`), ONE-TO-TWO (`X-X-Line`), and TWO-TO-ONE (`X-X-Short Angle`). The **short angle** enters as a concept and setup shot here. **Transition** zone is recognized and acted on — the player moves forward on short balls and attacks. **Endgame** is named and the player begins closing volleys.

**Active zones:** All six zones. Short angle enters as a concept. Line (executed in pattern). Transition (recognized and acted on). Endgame (named).

**Decision tree — Green 2:**
| Situation | Action | Why |
|---|---|---|
| Baseline, neutral | Crosscourt as setup (patterns: X-X, X-X-Line, X-X-Short Angle) | Patterns: crosscourt sets up; line or short angle finishes. |
| Baseline, defensive | Middle deep OR high crosscourt (defensive lob) | Defensive options expand. Lob is now in the toolkit. |
| Inside baseline (transition) | Line OR drop volley OR approach + volley | Transition is recognized and acted on. Line is the decisive shot when set up correctly. |

**Pattern in play:** TWO-TO-ONE (`X-X-Short Angle`) — crosscourt setups, then a short-angle ball that pulls the opponent off-court — introduces at Green 2.

**Movement:** Live-ball movement under pattern constraints. Defensive recovery from wide balls followed by a counter-attack. Forward movement to transition zone when the trigger fires. Bisector recovery must be the default in match play (gate criterion at this transition).

**Competition:** Sanctioned Green-ball events at regional level. Best-of-three sets. A healthy 45–55% win rate over 12 weeks is the competition target. Mid-match tactical adjustments are player-initiated.

**Mentality:** Self-talk audit and adjustment. Periodization awareness beginning (peak weeks vs. train weeks). Mid-match reframe after losing a set. Pre-event visualization routine introduced.

**Coach says — Technical:**
- Doing Well: Full-set scoring tolerance — strokes hold up across 6-game sets.
- Working On: Serve with placement and pace.
- Current Focus: Volley + overhead reliable under match pressure.
- Next Step: Slice and drop shot used tactically.

**Coach says — Tactical:**
- Doing Well: First-strike + construction patterns both available.
- Working On: Score-state adjustments mid-match.
- Current Focus: Approach + volley + recovery sequence.
- Next Step: Reading opponent patterns in real time.

**Gates to advance — Green 2 → Green 3:**
- [ ] `GREEN2__GREEN3__01` — Tactical (Court Mapping): Demonstrates one-to-one and two-to-one patterns in match play. Threshold: Each pattern observed in 2+ of 5 rallies during a match context (not just drill).
- [ ] `GREEN2__GREEN3__02` — Tactical (Court Mapping): Recognizes short ball and acts on it. Threshold: Acts on short balls (moves forward, attacks) in 60%+ of opportunities during observed play.
- [ ] `GREEN2__GREEN3__03` — Movement/Athletic: Bisector recovery is the default in match, not just drill. Threshold: Bisector recovery visible in 3/5 rallies during an observed match.
- [ ] `GREEN2__GREEN3__04` — Competition: Maintains ~50% win rate at age-appropriate Green-ball events. Threshold: 45–55% win rate (or higher) over a 12-week window.

**Failure mode alerts:**
- FM-08 CRITICAL: Evidence citation paper trail required for this promotion. All gate evidence must be logged with timestamps and observation records. Director approval must be documented in audit logs. Parent pressure to promote without complete evidence is the primary failure mode at this stage (A5 archetype).

---

### Green 3 — Matchplay

> *Personal style emerging. Endgame execution. Multi-day tournaments.*

**Volume band:** 10–14 hrs/week · 5–6 sessions · 90–105 min sessions
**Typical stage duration:** 6–12 months

**Technical:** All technical fundamentals consolidated at Green-ball pace. Personal style beginning to emerge. Drop shot and slice used at the right tactical moments. Serve with placement, pace, and spin variation. Overhead and approach both available under match pressure.

**Tactical:** Personal pattern preference is identified — the player can name their preferred patterns and execute them reliably in match play. **Endgame** is executed (not just named): closing volleys, defensive lobs, open-court placements. **Short angle** is used in transition situations. The player can name a game-style identity (counterpuncher, aggressive baseliner, all-court).

**Active zones:** All six zones executed. Personal pattern bias visible. Endgame executed reliably.

**Decision tree — Green 3:**
| Situation | Action | Why |
|---|---|---|
| Baseline, neutral | Crosscourt setup with personal pattern bias | Player's preferred patterns are showing — style discovery is part of Green 3. |
| Baseline, defensive | Middle deep + recovery; lob when available | Defensive recovery patterns drilled. Bisector is default in match now. |
| Inside baseline (transition) | Line or short angle + close to net | Short angle introduced in transition. Closing to net is part of the sequence. |
| Endgame (opponent out of position) | Open court placement | Pick the open court, calm hands. Composure over power. |

**Patterns in play:** ONE-TO-TWO (`X-X-Line`) mature, TWO-TO-ONE (`X-X-Short Angle`) maturing through Green 3 → Yellow 1.

**Movement:** Defensive recovery patterns drilled and tested under match pressure. Endgame footwork: closing the net, overhead position, defensive lob-and-recover. Plyometric work integrated into conditioning.

**Competition:** Multi-day Green-ball tournaments. Recovery between matches is part of the daily plan. Tournament weekend with full pre-match plan, in-event log, and post-event review. National-qualifier event exposure. Sectional ranking beginning to establish.

**Mentality:** Independent pre-match preparation. Tactical adjustments mid-match are player-initiated. Cue word + reset + reframe as an integrated system. Style statement: the player can articulate a 1-sentence tactical identity.

**Coach says — Technical:**
- Doing Well: Strokes hold up across 3 best-of-3 matches in a weekend.
- Working On: Serve with placement, pace, and spin variation.
- Current Focus: Volley, overhead, and approach all available under pressure.
- Next Step: Drop shot and slice used at right moments.

**Coach says — Tactical:**
- Doing Well: Five-pattern library matched to game style.
- Working On: Style identification (counterpuncher, aggressive baseliner, all-court).
- Current Focus: Endgame patterns (closing volleys, defensive lobs).
- Next Step: Win/loss patterns by opponent style tracked.

**Gates to advance — Green 3 → Yellow 1:**
- [ ] `GREEN3__YELLOW1__01` — Competition: Wins ≥50% of matches at age-appropriate Green-ball events over 12 weeks. Threshold: ≥50% win rate at age-appropriate events over a 12-week window.
- [ ] `GREEN3__YELLOW1__02` — Tactical (Court Mapping): Demonstrates a personal game style emerging. Threshold: Player can name preferred pattern AND execute it in 3 of 5 rallies during a coached or observed match.
- [ ] `GREEN3__YELLOW1__03` — Technical: Serve and return are reliable point-starters. Threshold: First-serve in-rate ≥60%; return-of-serve in-rate ≥75%.
- [ ] `GREEN3__YELLOW1__04` — Mentality/Learning Behavior: Tactical decisions are intentional, not reactive. Threshold: Player can articulate tactical intent for 3+ key points after an observed match.

**Failure mode alerts:**
- FM-06 HIGH: Recreation-oriented players (A4) may not generate the match volume needed for gate `GREEN3__YELLOW1__01`. If `recreation_flag` is set, recalibrate the competition gate to internal academy events. Director confirmation required.
- FM-08 CRITICAL: Evidence citation paper trail required for this promotion. Parent-driven pressure to advance is the primary failure mode at Green 3 for A5 (High-Pressure Family) archetype. Every gate must have timestamped evidence records and director-approved promotion documentation.

---

### Yellow 1 — Foundation

> *Standard ball, full court. Stroke production refined. Yellow-ball events.*

**Volume band:** 12–16 hrs/week · 5–6 sessions · 90–120 min sessions
**Typical stage duration:** 6–12 months

**Technical:** Standard ball, full court. Stroke production refined for pace and spin. All technical fundamentals must be reliable — no shot is a liability. First-serve percentage and points won on first serve enter the evidence picture. Topspin forehand and backhand with pace on demand.

**Tactical:** The full pattern library is active and crosscourt-line discrimination is automatic. **Transition** zone is executed reliably at standard pace. **Endgame** is consistent. SERVE+1 and RETURN+1 enter as concepts (serve to a target → predetermined +1 forehand). Player can name a preferred game style. Opponent-awareness beginning: player notices opponent tendencies across a match.

**Active zones:** All six zones executing reliably at standard ball pace. Transition and Endgame are reliable (not just named).

**Decision tree — Yellow 1:**
| Situation | Action | Why |
|---|---|---|
| Baseline, neutral | Crosscourt + line patterns at standard pace | Full pattern library active. Pattern fidelity at standard pace is the skill. |
| Baseline, defensive | Middle deep, high arc, recover | Defensive balls need depth and height at standard pace — flat defensive balls get attacked. |
| Inside baseline (transition) | Line / short angle + close to net | Transition execution at standard ball pace. |
| Endgame | Open court, then close | Close after the finish ball — don't stay back. |

**Patterns in play:** SERVE+1 and RETURN+1 enter as concepts. Player identifies and names a preferred construction pattern.

**Movement:** Full-court coverage at standard pace. Defensive-to-offensive transition instinctive. Forward movement to short balls in transition zone. First-step quickness and reactive footwork at standard pace.

**Competition:** Yellow-ball sanctioned events. Best-of-three full sets. A ~50% win rate at age-appropriate events is the competition target. Pre-match scouting routine introduced. Game plan in written or verbal one-page format. First national-level event (equivalent to Level 5) with documented review.

**Mentality:** Self-managed pre-match, between-match, and post-match routines. Tactical adjustments self-initiated. Periodization awareness across the year. One-point focus on big points. Journaling or daily log introduced.

**Coach says — Technical:**
- Doing Well: Yellow-ball pace and weight adapted to.
- Working On: Heavy and flat shape calibrated.
- Current Focus: Serve plus one with first-strike forehand.
- Next Step: Volley, overhead, and approach reliable under match pressure.

**Coach says — Tactical:**
- Doing Well: First-strike + construction + counter-attack patterns all available.
- Working On: Pre-match scouting (when info available).
- Current Focus: Score-state and recovery patterns identified.
- Next Step: Style refinement (clearer about own tactical identity).

**Gates to advance — Yellow 1 → Yellow 2:**
- [ ] `YELLOW1__YELLOW2__01` — Technical: Comfortable rallying at standard pace (sustained 6+ shot rallies). Threshold: 6+ shot rallies sustained in 4 of 10 sampled rallies during observed play.
- [ ] `YELLOW1__YELLOW2__02` — Technical: All technical fundamentals reliable — no shot is a liability. Threshold: All of: forehand, backhand, volley, serve, return, slice — none causing unforced errors at ≥3× match rate.
- [ ] `YELLOW1__YELLOW2__03` — Competition: Competitive Yellow-ball matches with positive ratio at appropriate level. Threshold: ≥50% win rate at age-appropriate Yellow-ball events over 12 weeks.
- [ ] `YELLOW1__YELLOW2__04` — Mentality/Learning Behavior: Self-managed pre-match routine. Threshold: All of: equipment check, hydration, warm-up sequence, mental cue — all present and player-initiated × 5 observed events.

**Failure mode alerts:**
- FM-08 CRITICAL: Evidence paper trail required for this promotion. The Yellow 1 → Yellow 2 gate is a meaningful milestone — director must document approval with evidence citations. A5 (High-Pressure Family) archetype creates the highest promotion pressure at this stage.

---

### Yellow 2 — Intermediate

> *Tactical maturity. Single-periodized year. 3:1 healthy win-loss target.*

**Volume band:** 14–18 hrs/week · 6 sessions · 90–120 min sessions
**Typical stage duration:** 6–12 months

**Technical:** Tactical maturity emerging. Endgame awareness — recognizing when to finish a point rather than continue construction. Defensive game is reliable: deep defensive balls, lobs, counter-attacking from extreme positions. Serve and return are weapons or reliable neutralizers (first-serve points won ≥55%, return points won ≥35%).

**Tactical:** Multi-shot patterns under pressure — cross-cross-line, line-cross-line. SERVE+1 is executed (not just conceptual). RETURN+1 is executed. ANTI-PATTERN enters as a concept: deliberately varying a known pattern to prevent the opponent from reading it. DEFENSIVE-TO-OFFENSIVE TRANSITION: recognizing the moment to flip from defense to counter-attack.

**Active zones:** All zones. Anti-pattern concept introduced. Defense-to-counter transition recognized as a zone.

**Decision tree — Yellow 2:**
| Situation | Action | Why |
|---|---|---|
| Serve / first ball | Serve + 1: serve to target, predetermined +1 shot | The +1 plan is the skill. Serving without a plan is reactive. |
| Return / first ball | Return + 1: neutralize OR attack based on serve quality | Return is a tactical decision made before contact. |
| Defensive-to-offensive | Defensive ball, then counter-punch when chance appears | Recognizing the flip moment is itself a tactical skill. |

**Patterns in play:** ANTI-PATTERN enters as a concept. DEFENSIVE-TO-OFFENSIVE TRANSITION enters as a pattern.

**Movement:** Defensive-to-offensive transition under fatigue. Wide-ball recovery patterns reliable. Multi-day tournament movement quality. Strength 3 sessions per week with barbell compound lifts under qualified S&C.

**Competition:** Sanctioned Yellow-ball events at regional and beginning-national level. A 3:1 healthy win-loss ratio is the annual competition plan target — mostly development events with fewer challenge events. Periodization: single-periodized year (preseason, in-season, post-season).

**Mentality:** Mid-match tactical adjustments self-initiated across multiple layers (score state, opponent style, physical condition). Performance anxiety strategies are active. Visualization routine pre-event.

**Coach says — Technical:**
- Doing Well: Strokes hold up at full yellow-ball pace.
- Working On: Heavy/flat calibration on demand.
- Current Focus: Serve plus one + recovery as a sequence.
- Next Step: Drop shot disguise and tactical layers.

**Coach says — Tactical:**
- Doing Well: Five-pattern library expanded with style nuances.
- Working On: Periodization mapping to tournament calendar.
- Current Focus: First-strike forehand variations.
- Next Step: Game-style recognition (counterpuncher, aggressive baseliner, all-court, big-server).

**Gates to advance — Yellow 2 → Yellow 3:**
- [ ] `YELLOW2__YELLOW3__01` — Tactical (Court Mapping): Identifiable game style — player and coach can name it. Threshold: Player and coach independently name the same game style; style is visible in observed match play.
- [ ] `YELLOW2__YELLOW3__02` — Tactical (Court Mapping): Tactical maturity in pattern execution under pressure. Threshold: Executes 2+ patterns reliably (3+ of 5 attempts each) under observed match pressure.
- [ ] `YELLOW2__YELLOW3__03` — Technical: Serve and return are weapons or reliable neutralizers. Threshold: First-serve points-won ≥55% AND return-points-won ≥35% at age-appropriate events over 8 weeks.
- [ ] `YELLOW2__YELLOW3__04` — Fitness Support: Physical preparation matches competitive demands — no fatigue-driven losses in last 12 weeks. Threshold: Coach + S&C review: no third-set physical breakdown visible in last 3 months of match data.

**Failure mode alerts:**
- FM-05 HIGH: Mentality column observables for pressure tolerance are not fully specified at Yellow stages. Gate `YELLOW2__YELLOW3__01` and `YELLOW2__YELLOW3__02` must be supplemented with explicit mentality observables: between-point routine adherence counts, post-match review completion rate, and pressure-point performance counts. These must be added before Yellow-band players are actively managed in AOS.

---

### Yellow 3 — Matchplay

> *Personal game style with intentional variation. National-level competition.*

**Volume band:** 16–22 hrs/week · 6–7 sessions · 90–120 min sessions
**Typical stage duration:** 6–12 months

**Technical:** Building a personal game style with intentional variation. Pattern-based play with tactical variation tied to opponent profile. All technical fundamentals at competition intensity — small margins drive results. Serve and return as weapons differentiate this player from Yellow 2.

**Tactical:** ANTI-PATTERN is executed: deliberately varying a known pattern prevents the opponent from reading it. PATTERN BY OPPONENT PROFILE enters as a concept — pattern selection is driven by the specific opponent type (counterpuncher gets short angles, first-striker gets neutralizers). Full tactical library available, deployed by surface, score-state, and opponent.

**Active zones:** All zones. Anti-pattern executed. Opponent-profile-matched pattern selection beginning.

**Decision tree — Yellow 3:**
| Situation | Action | Why |
|---|---|---|
| Baseline, neutral | Personal pattern + deliberate variation (anti-pattern) | A pattern that always runs is read by a smart opponent. Deliberate variation is intentional. |
| Vs specific opponent profile | Pattern selection by opponent profile | Profile-aware play: same pattern doesn't work against every opponent. |

**Movement:** Movement matches game-style demands (counterpuncher = elite recovery; first-striker = forward movement + transition). Multi-day event movement quality. Sprint, plyometric, and reactive footwork integrated. Single-periodized year approaching double-periodization.

**Competition:** Sanctioned Yellow-ball events at national level. National ranking established. Beginning serious tournament planning with periodization. First ITF Junior exposure if HP-bound. Full pre-event, in-event, and post-event review cycle.

**Mentality:** Performance routines (pre, during, post-match) fully self-managed and under self-evaluation. Recovery from a loss within 24 hours. Setting performance goals and outcome goals separately. Career path conversation beginning (pro vs. college).

**Coach says — Technical:**
- Doing Well: Strokes hold up under national-level match pressure.
- Working On: Pace + spin + placement on demand.
- Current Focus: Style fully visible across matches.
- Next Step: Tactical layer in shot selection.

**Coach says — Tactical:**
- Doing Well: Game-style identified and refined.
- Working On: Pre-match scouting standardized.
- Current Focus: Adjustment routine when down or up significantly.
- Next Step: Pattern execution under pressure.

**Gates to advance — Yellow 3 → HP 1:**
- [ ] `YELLOW3__HP1__01` — Competition: Demonstrated ability to win at competitive sanctioned events at appropriate level. Threshold: ≥40% match-win rate at national-level events (or equivalent) over a 12-week window.
- [ ] `YELLOW3__HP1__02` — Mentality/Learning Behavior: Psychologically and physically ready for year-round tennis-specific training. Threshold: All of: load tolerance demonstrated (no overuse flags last 12 weeks), ACR in safe range, owns daily routine independently.
- [ ] `YELLOW3__HP1__03` — Mentality/Learning Behavior: Ownership of preparation — player drives the plan, coach approves. Threshold: Player initiates 3+ tactical or training adjustments per 4-week review cycle × 2 consecutive cycles.
- [ ] `YELLOW3__HP1__04` — Tactical (Court Mapping): Personal game style is durable under fatigue and pressure. Threshold: Game style visible in 3rd-set scenarios in 3 of 4 observed tournament matches.

**Failure mode alerts:**
- FM-04 CRITICAL: The HP 1 entry gate (`YELLOW3__HP1` series) is currently under-specified for the Performance-Oriented archetype (A3). These 4 criteria do not yet include a multi-domain evidence requirement covering pattern execution under pressure across surfaces, fitness readiness confirmed by S&C, and minimum match volume over the evidence window. These gates must be reviewed and reinforced before any HP-band player is promoted in AOS. Do not use these gates as written for HP promotion without director sign-off on this known gap.

---

### High Performance 1 — Foundation

> *Year-round tennis-specific training. Single-periodized. National to international.*

**Volume band:** 18–25 hrs/week · 6–7 sessions · 90–150 min sessions
**Typical stage duration:** 12–18 months

**Technical:** All technical fundamentals at competition intensity. Weapon identification: what is this player's primary point-winning shot? Specialty shots (spin variation, drop shots, kick serve) as differentiators. Surface adaptation emerging: hard court, clay, and grass require technical adjustments that are beginning to be integrated.

**Tactical:** Full tactical literacy. Pattern variation across opponent profiles. ANTI-PATTERN is executed reliably. PATTERN BY OPPONENT PROFILE is executed. At HP 1, the focus is pattern fidelity under fatigue — patterns must hold in third sets, late in matches, and under pressure points.

**Active zones:** All zones executing at pro-style intensity. Pattern selection is automatic and opponent-profile-matched.

**Decision tree — HP 1:**
| Situation | Action | Why |
|---|---|---|
| Late in match (fatigue) | Patterns hold; pace drops if needed; shape preserved | Pattern fidelity under fatigue is the HP-readiness marker. |
| Pressure points | Highest-% pattern; conviction over creativity | On break point, set point, match point — highest-% pattern, executed with conviction. |

**Movement:** Full physical preparation integrated with tennis training. Sport-specific power, speed, and endurance. Multi-surface adaptation. Pro-style movement quality target. ACR tracked formally as a safety metric.

**Competition:** Year-round national competition. First ITF or equivalent international events. Self-managed preparation, performance, and recovery. Career planning conversations are active.

**Mentality:** Self-managed performance preparation. Pressure-point execution under sanctioned-level conditions. Mental skills routine at pro level. Identity statement, style, and signature shots clearly articulated.

**Coach says — Technical:**
- Doing Well: Strokes at international junior level.
- Working On: Pace, spin, placement, disguise integrated.
- Current Focus: Style + signature shots clearly identified.
- Next Step: Specialty shots (spin variation, drop shots) as differentiators.

**Coach says — Tactical:**
- Doing Well: Game-style + 5-pattern library + opponent scouting.
- Working On: Match construction over hours.
- Current Focus: Pre-match plan + in-match adjustments.
- Next Step: International-level tactical awareness.

**Gates to advance — HP 1 → HP 2:**
- [ ] `HP1__HP2__01` — Competition: Demonstrated competitive results at appropriate level. Threshold: ≥40% match-win rate at national events; making rounds at international junior events over a 12-week window.
- [ ] `HP1__HP2__02` — Fitness Support: Physical preparation matches single-period demands — no fatigue-driven losses. Threshold: All of: ACR in safe range last 12 weeks, no overuse injuries, S&C plan complete for the block.
- [ ] `HP1__HP2__03` — Tactical (Court Mapping): Tactical patterns reliable under fatigue (pattern fidelity holds in third sets). Threshold: Pattern execution rate in 3rd sets within 10% of 1st-set rate over 4 observed matches.
- [ ] `HP1__HP2__04` — Mentality/Learning Behavior: Self-managed competitive plan with coach approval. Threshold: Player drafted next-block competitive plan; coach + director have reviewed and approved it.

---

### High Performance 2 — Intermediate

> *Double-periodized year. Tournament travel autonomy. Opponent-modeling.*

**Volume band:** 20–28 hrs/week · 6–7 sessions · 90–180 min sessions
**Typical stage duration:** 12–18 months

**Technical:** Weapon refinement under all conditions. Pattern execution at international-junior-level speed and spin. Surface adaptation reliable across hard, clay, and grass. Signature shots differentiate this player from peers at the same level.

**Tactical:** Opponent-modeling: practice patterns are designed to mimic specific opponent profiles. Tactical adjustments mid-match are sophisticated across multiple simultaneous layers — pattern, pace, spin, positioning, score state. DEFENSIVE-TO-OFFENSIVE TRANSITION is fully executed.

**Active zones:** All zones. Opponent-modeling adds a meta-layer above the zone vocabulary.

**Decision tree — HP 2:**
| Situation | Action | Why |
|---|---|---|
| Mid-match adjustment | Read opponent patterns, adjust own pattern selection | Tactical adjustments mid-match are automatic and effective. Sticking with a plan that isn't working is the failure mode. |

**Movement:** Double-periodized year structure. Power, speed, endurance, and agility all targeted in separate annual blocks. Multi-surface physical preparation. Tournament travel physically managed without breakdown.

**Competition:** Double-periodized competitive year — two main competitive blocks with development blocks between. Tournament travel autonomy demonstrated: player has self-managed 3+ tournament trips (logistics, recovery, routine). Junior top-100 ranking targeted.

**Mentality:** Mental skills routine maintained on the road. Identity statement and recovery routine stable across travel disruption. Career commitment (pro path or college path) beginning to clarify. Travel coach or coach team established.

**Coach says — Technical:**
- Doing Well: Strokes at junior international top-100 level.
- Working On: Signature shots clearly differentiate the player.
- Current Focus: Surface adaptation reliable.
- Next Step: Specialty shots refined.

**Coach says — Tactical:**
- Doing Well: Match construction over best-of-3 to best-of-5.
- Working On: Opponent scouting and self-scouting routine.
- Current Focus: Pre-match plan + in-match + post-match cycle.
- Next Step: International-level tactical IQ.

**Gates to advance — HP 2 → HP 3:**
- [ ] `HP2__HP3__01` — Fitness Support: Double-periodized year successfully managed. Threshold: All of: two clean competitive blocks completed, no major injury, S&C plan reviewed and confirmed for both blocks.
- [ ] `HP2__HP3__02` — Mentality/Learning Behavior: Tournament travel autonomy demonstrated. Threshold: Player has self-managed 3+ tournament trips (logistics, recovery, routine, nutrition) without coach travel support.
- [ ] `HP2__HP3__03` — Tactical (Court Mapping): Tactical adjustments executed mid-match in pressure scenarios. Threshold: Mid-match tactical adjustment observed and confirmed effective × 3 separate tournament matches.
- [ ] `HP2__HP3__04` — Competition: Healthy 3:1 win-loss in primary competitive plan over 24-week window. Threshold: Win rate ≥75% in events designated as "primary plan" (development events), 40%+ at challenge events.

---

### High Performance 3 — Matchplay

> *Triple-periodized. Performance-on-demand. Living-as-a-pro readiness.*

**Volume band:** 20–30 hrs/week · 6–7 sessions · 90–180 min sessions
**Typical stage duration:** Open — varies (12–24+ months)

**Technical:** Technical refinement only — margins are tight and small gains drive results. Spin-pace mix calibrated by surface, opponent, and score state. Pro-tour stroke integrity emerging. Signature shots are differentiators at futures and challenger level.

**Tactical:** Performance-on-demand. Tactical patterns deployed based on full opponent dossiers, surface, score state, and physical condition. Anti-pattern is automatic. Pattern by opponent profile is fully executed. Match construction over best-of-five available.

**Active zones:** All zones. Full dossier-based deployment. Pro-tour tactical layer.

**Decision tree — HP 3:**
| Situation | Action | Why |
|---|---|---|
| Major event, biggest stage | Full pattern library available, deployed by surface, opponent, score-state | Performance-on-demand: tactics driven by full preparation, not in-match improvisation. |

**Movement:** Triple-periodized year. Performance optimization. Surface-specific physical preparation. Pro-tour movement quality at futures and challenger events.

**Competition:** Triple-periodized competitive year — national, international, and professional event exposure. Career path (pro tour or top-program college) committed to. Tour-coach handoff preparation.

**Mentality:** Full ownership of preparation, performance, and recovery. Pro-style mental skills routine fully established. Career commitment in place. Family role shifts to emotional support.

**Coach says — Technical:**
- Doing Well: Strokes at junior slam main draw level.
- Working On: Differentiating signature shots.
- Current Focus: Surface adaptation across hard, clay, grass.
- Next Step: Pro-tour stroke integrity emerging.

**Coach says — Tactical:**
- Doing Well: Pro-style match construction.
- Working On: Pro-tour level scouting and adjustment.
- Current Focus: Best-of-5 match management at slams.
- Next Step: Pro-tour tactical layer.

**Exit gate / next pathway readiness — HP 3 → Living-as-a-Pro:**
- [ ] `HP3__OUT__01` — Competition: Triple-periodized year managed successfully; tournament travel fully self-managed; living-as-a-professional readiness demonstrated. Threshold: All four conditions met over a 12-month review window.

> ⚠ **Note on exit gate:** This transition currently has a single gate criterion covering the Competition domain only. This is acknowledged as an intentional product decision, not an oversight — "living-as-a-pro readiness" is a performance management and career judgment, not a curriculum question. However, before HP 3 players exist in AOS, a decision should be made: expand to 4 criteria (consistent with all other transitions), or retain 1 criterion with a mandatory director narrative field. See `docs/curriculum/angles-curriculum-synthesis.md` Section 14.

---

## ACR and Load Management Reference

### ACR Target Range

All stages carry an ACR target range used to manage injury risk:
- **Red band:** 0.8–1.2 (very stable — volume is low by design)
- **Orange through HP:** 0.8–1.3

**⚠ Definition requires confirmation.** "ACR" in `AOS_Curriculum_Volume.xlsx` is not defined in the column header. This almost certainly refers to the **Acute:Chronic Workload Ratio** — a validated load management metric where values in the 0.8–1.3 range represent the "sweet spot" associated with minimized injury risk. If confirmed, the formula is: 7-day rolling load ÷ 28-day rolling average load. Values above 1.5 represent spike risk. **This definition must be explicitly confirmed before any ACR-based load management algorithm is built in AOS.**

### Deload Cadence by Stage

| Band | Deload cadence |
|---|---|
| Red 1–3 | Built into year structure (school breaks) |
| Orange 1–2 | Deload week every 6–8 weeks |
| Orange 3 – Green 3 | Deload week every 4–6 weeks |
| Yellow 1–3 | Deload week every 4 weeks + periodic easy weeks |
| HP 1–3 | Periodized block-based deload (build / peak / deload) |

### Overload Flags by Band

| Band | Primary overload signal |
|---|---|
| Red | Disengagement (not physical overload — volume is too low) |
| Orange | Elbow and wrist soreness as serve volumes increase |
| Green | Growth-plate symptoms, sleep quality changes, school-tennis balance breakdown |
| Yellow | Shoulder, low back, wrist. Sleep quality drops are an early flag. |
| HP | Soft tissue and joint integrity. Travel-cumulative fatigue. HRV trends. |

### Stage Duration Is Guidance, Not a Promotion Rule

**Stage duration ranges are guides, not targets.** A player who meets all gate criteria in 4 months advances. A player who spends 18 months at a stage is not behind. This must be communicated clearly in any UI that surfaces stage duration to coaches, players, or parents. Stage duration communicates typical range — not expectation or deadline.

### FM-11 CRITICAL: Return-to-Play State

Applies at all stages. When a player is returning from injury, the standard gate evidence windows cannot accumulate because the player cannot generate the required rally volume or match volume. AOS must implement an explicit `return_to_play_state` on the player record that pauses normal gate evidence windows and substitutes return-to-play specific criteria. This is a hard data model requirement, not an optional feature.

### FM-09 HIGH: Intake Assessment Protocol

Applies at all stages (any stage entry, including transfers). Stage placement at intake must be a structured gate evaluation — not a subjective "see where they fit." This applies to transfer-in players (A6 archetype) in particular, who may claim a stage higher than their validated level. An intake assessment protocol must be defined and implemented as a structured workflow before transfer-in players can be managed in AOS.

---

## Player Archetype Quick Reference

These eight archetypes drive specific curriculum protection requirements. Every player record should carry a primary `archetype_tag` (A1–A8) and optionally a secondary tag. The tag is informational — it shapes how the curriculum is applied, not whether it is applied.

| Tag | Name | Age Band | Entry Stage | Profile | Primary Curriculum Protection |
|---|---|---|---|---|---|
| **A1** | Early Developer | 8–10 | Red 2 | Athletic for age, started early, parents engaged, accelerated through Red in 6–9 months. | Tactical and decision-making gates must be enforced regardless of ball-striking quality. Competition Track must not race ahead of Skill Track. |
| **A2** | Late Developer | 12–14 | Orange 1 | Started at 11–12 in a school program. Coordination maturing, but cognition and attention are above typical color-band age. | Label suppression (FM-02): do not show color-band label if `entry_age > 12`. Volume modifiers needed (FM-03). |
| **A3** | Performance-Oriented | 13–16 | Yellow 1 | Confirmed pathway player. UTR or national ranking ambition. 4–6 sessions/week plus matches plus off-court work. | Honest evidence over flattering evidence. ACR thresholds enforced. Mentality observables at Yellow stages required. HP 1 entry gate must be strengthened (FM-04). |
| **A4** | Recreation-Oriented | 10–14 | Orange 2 | Tennis is one of three or four activities. 1–2 sessions/week, no tournament ambition. | `recreation_flag` on player record recalibrates Competition gates to internal events. `healthy_plateau_state` available when player caps voluntarily (FM-06, FM-07). |
| **A5** | High-Pressure Family | 9–13 | Green 1 | Talented player. Parent driving the timeline aggressively. Demands promotion before gate evidence is complete. | Gate objectivity is the shield. Every promotion requires evidence citation paper trail. Director approval must be logged to audit logs (FM-08). |
| **A6** | Transfer-In Mid-Stage | 12–15 | Green 2 (claimed) / Green 1 (validated) | Transferring from another academy, claimed at a higher stage. Match experience may exceed validated Skill Track level. | Structured intake assessment protocol required — not free-form notes. Stage placement is a gate evaluation, not a judgment call (FM-09). |
| **A7** | Injury-Return | Any | Stage prior to injury, volume-capped | Cleared by medical to return. Was at, say, Yellow 2 before injury. Cannot generate standard gate evidence during recovery. | `return_to_play_state` on player record. Gate evidence windows paused. Return-to-play specific criteria substituted (FM-11). |
| **A8** | Gap-Year / Late-Start | 16–20+ | Orange 1 (motor) / Green 3 (cognition) | Adolescent or young adult starting seriously for the first time. Motor skills are developing at adult body. | Label suppression (FM-02). Accelerated stage duration where gate evidence is met. Competition Track opens only at Skill Track Green 1 or later (FM-13). Volume archetype-aware modifiers (FM-12). |

---

## Source of Truth Reference

| Source | What it governs | Status |
|---|---|---|
| `AOS_Curriculum_Matrix.xlsx` | Stage descriptions, domain definitions, 120 Matrix cells | PRIMARY — if this document conflicts with Matrix, update this document |
| `AOS_Curriculum_Gates.xlsx` | All gate IDs, thresholds, recording methods, evidence windows | PRIMARY — gate criteria here are exact copies. Gate Library is authoritative. |
| `AOS_Curriculum_Tactics.xlsx` | Tactical vocabulary (6 zones), Decision Trees, Pattern Progression, Bisector principle | PRIMARY — tactical vocabulary is locked. Do not extend zone names without updating Tactics.xlsx first. |
| `AOS_Curriculum_CoachLanguage.xlsx` | Doing Well / Working On / Current Focus / Next Step for all 15 stages × 8 domains | PRIMARY — all coach-facing language in the app queries this source |
| `AOS_Curriculum_Volume.xlsx` | Weekly hours, sessions, duration, stage duration, ACR, deload | SUPPORTING — load guidance, not gate criteria |
| `AOS_Curriculum_Competition.xlsx` | Competition Track progression, tournament types, behaviors | SUPPORTING — Competition Track is a parallel dimension, not the primary record |
| `AOS_Curriculum_Fitness.xlsx` | Off-court fitness phases, energy systems, strength progression | SUPPORTING — informs fitness module, not gate criteria (except HP-band fitness gates) |
| `AOS_Curriculum_StressTest.xlsx` | 8 archetypes, 14 failure modes | PRIMARY for product requirements — failure modes are engineering requirements, not suggestions |
| `AOS_Curriculum_TechModel.xlsx` | Angles product integration reference | **EXCLUDED from core curriculum.** Deferred to optional Angles Tools Integration Layer. See `docs/curriculum/product-tool-exclusion-decision.md`. |

---

*This document is the canonical curriculum reference for Academy OS. Update it when source files change. Do not use it to override source files — use it as a synthesized, coach-readable view of what the source files contain.*
