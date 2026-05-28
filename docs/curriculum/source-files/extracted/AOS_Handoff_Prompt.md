# AOS Curriculum Build — Handoff to Piece 5 (Drill Library)

Paste the block below as your first message in the new chat. Attach all 5 files from this session's outputs.

---

**Continuation from prior session — Angles Academy OS curriculum build.**

I'm Farsh, founder of Angles (motor learning company, tennis training tools, building Angles Academy OS as a multi-role tennis academy management platform with Dabul Tennis Academy as pilot client).

In a prior chat, Claude acted as my curriculum specialist and built the developmental spine for AOS. We have completed **Pieces 1 through 4** of a 10-piece sequence. Five files are attached:

1. `AOS_Curriculum_Matrix.xlsx` — Piece 1: 15 stages × 8 domains = 120-cell developmental spine. Sheets: README, Stage Index, Domain Index, Matrix.
2. `AOS_Curriculum_Matrix_Companion.md` — Piece 1 explainer.
3. `AOS_Curriculum_Gates.xlsx` — Piece 2: 57 measurable level-up gate criteria across 14 transitions. Sheets: Gate Spec Format, Gate Library, Summary.
4. `AOS_Curriculum_TechModel.xlsx` — Piece 3: Angles technical model (Swinget / Angle / Swing Check three-layer stack + 6-stage methodology + 15-stage tool integration map + volume cadence + failure modes). Heavy `[PROPOSED:]` flagging — academy IP that I'll correct.
5. `AOS_Curriculum_Tactics.xlsx` — Piece 4: court mapping zone atlas, 30 stage-by-zone decision trees, 8 pattern progressions, bisector recovery progression, court diagram.

**Naming convention locked:** each color subdivides into .1 Foundation / .2 Intermediate / .3 Matchplay across all 5 colors plus HP. 15 stages total, 14 in-curriculum transitions plus the HP3 → Out transition.

**Angles philosophy embedded throughout (must continue in Piece 5+):**
- Learn / Train / Play daily session structure
- Skill Track and Competition Track are separate but connected
- Court mapping vocabulary: middle, crosscourt, short angle, line, transition, endgame
- Intention → action → skill
- Swinget as foundational warm-up + perception-action coupling tool
- Evidence-based level movement (gates, not time-served)
- Positive coaching language: Doing Well / Working On / Current Focus / Next Step
- Three diagnostic zones: Behind / Between Legs / Green Zone ✓
- 6-stage Angle methodology: SwingCheck → Guided Reps → Strap Mode → Hand Fed/Racket Fed → Stances → Live Play
- Aesthetic: #C8FF00 neon on #060606 black, Bebas Neue / Barlow Condensed / Barlow

**Resume here: build Piece 5 — the Drill Library, scoped for AOS ingestion.**

The drill library is the heaviest single output of the sequence. The user has explicitly requested:
- **Do NOT use the 6-stage Angle Technical Model methodology as the drill structure.** The drill library should be independent of Layer 2 of the technical model. Drills should be playable by any coach/academy, not Angles-product-dependent.
- **Scope the library in the most useful way for AOS ingestion.** This means structured for database import — every drill has the same schema, with tags, parameters, and progression metadata that the AOS curriculum engine can query.

**Suggested approach (you choose):**
Build a structured drill database (~150–200 drills) with this schema per drill:
- `drill_id` (e.g., DRILL_ORANGE2_TAC_007)
- `name`
- `stage_min` and `stage_max` (which stages this drill is appropriate for)
- `domain` (Technical / Tactical / Movement / Competition / Mentality / Fitness)
- `session_block` (Warm-Up / Focus / Train / Play / Game)
- `objective` (one sentence, the intention)
- `setup` (court layout, equipment, players needed)
- `procedure` (numbered steps the coach runs)
- `coaching_cues` (Doing Well / Working On / Current Focus / Next Step phrasing)
- `progression_easier` (how to scale down for struggling player)
- `progression_harder` (how to scale up)
- `success_criteria` (what 'good' looks like — feeds back into Gate library)
- `duration_minutes`
- `players_needed`
- `tags` (e.g., crosscourt, transition, first-strike, recovery, doubles)

Distribute drills proportionally across stages (more at the high-volume Orange/Green stages, fewer at Red and HP). Cover all 5 session blocks. Cover all 6 domains except keep Angles-specific technical drills out per the user's request.

**Then proceed to Pieces 6–10 in sequence:**
- Piece 6 — Competition Track (parallel 15-stage)
- Piece 7 — Fitness Path architecture
- Piece 8 — Coach-facing translation (Doing Well / Working On / Current Focus / Next Step language at every stage and domain)
- Piece 9 — Volume and progression rate guidance
- Piece 10 — Stress-test against player profiles

Don't wait for confirmation between pieces — keep building. Flag any academy-IP gaps with `[PROPOSED:]` and continue.

**Working style:** Direct, iterative, technically precise. Copy-paste ready code blocks. No formatting friction. Build dense, coach-actionable content. Use the xlsx skill for spreadsheet outputs.

---

That's the handoff. Five files + the prompt above gets the new instance fully oriented.
