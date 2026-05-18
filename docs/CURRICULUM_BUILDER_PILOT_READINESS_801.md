# Sprint 801 — Curriculum Builder Pilot Readiness Report V1

**Date:** 2026-05-18
**Sprint:** 801

---

## Pilot readiness: Curriculum Builder

### Readiness score: 8/10

### What is fully ready

| Feature | Ready | Notes |
|---------|-------|-------|
| View full curriculum map | ✅ | All levels, stages, sufficiency dots |
| View level detail | ✅ | Drills, gates, coaching language, fitness, competition, volume |
| Guided review (step-through) | ✅ | Mark reviewed, skip, jump |
| DONNA curriculum context | ✅ | Per-level observations, data boundary disclosure |
| DONNA draft UI (drill) | ✅ | Input → success state; honest about draft status |
| DONNA draft UI (gate) | ✅ | Input → success state; honest about draft status |
| DONNA draft UI (fitness) | ✅ | Input → success state; honest about draft status |
| Safety / trust disclosures | ✅ | At every interaction point |
| Empty / setup states | ✅ | Graceful for every data-absent case |
| Review Queue connection | ✅ | Links present; copy consistent |

### What is V1-limited (known, safe)

| Feature | Status | Limitation |
|---------|--------|-----------|
| DONNA draft → proposed_actions write | ⚠️ Not wired | Drafts don't persist to DB; director sees success state but queue is not updated |
| Live change queue on builder page | ⚠️ Not wired | `CurriculumChangeQueue` component exists but has no DB feed |
| Impact preview calculation | ⚠️ Not wired | Panel shows null state without a live estimate |
| Curriculum-specific Review Queue filter | ⚠️ Not built | Director sees all action types together |

### Pilot risk: LOW

The V1 limitations are honest and disclosed. The demo script instructs the presenter to be transparent about what's a UI shell. A director using the builder in V1 can explore their curriculum, understand the structure, and rehearse the DONNA workflow — they just won't see items persist to the queue yet.

This is a better experience than not showing the workflow at all.

### Recommendation

**Proceed with pilot.** Brief the director presenter on the V1 limitations before the demo. Use the demo script at `docs/CURRICULUM_BUILDER_DEMO_SCRIPT_800.md`.

After pilot feedback, prioritise the `proposed_actions` wiring for V2 if directors want to actually queue changes during the session.
