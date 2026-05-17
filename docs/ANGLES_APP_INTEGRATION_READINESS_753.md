# Angles App Evidence Integration Readiness — Sprint 753

**Sprint:** 753
**Date:** 2026-05-17

---

## Purpose

Assess readiness for integrating Angles App video analysis evidence into AcademyOS player development profiles.

---

## What Is the Angles App?

The Angles App is a video analysis tool that coaches use to capture tennis technique data — angles, swing paths, contact points. The curriculum research files reference Angles App as an evidence source for assessment gates.

**Curriculum connection:** `docs/curriculum/angles-curriculum-synthesis.md` documents how Angles App evidence maps to curriculum requirements and development gates.

---

## Current Integration State

| Capability | Status | Notes |
|---|---|---|
| Angles data in DB | ❌ Not built | No schema for video evidence |
| Angles evidence in gate records | ❌ Not built | `player_gate_status` doesn't yet reference video evidence |
| Angles connection to player profile | ❌ Not built | No Angles App API connection |
| Angles evidence in coach notes | ⚠️ Partial | Coach can reference video evidence in free-text notes |
| Curriculum mapping doc | ✅ Exists | `docs/curriculum/angles-curriculum-synthesis.md` |

---

## Integration Architecture (Future)

When Angles App integration is built, it should:

1. Accept Angles App evidence payloads via an authenticated API endpoint
2. Map video evidence to `curriculum_gates.id` using the angles-curriculum mapping
3. Write to `player_gate_status` as a new evidence entry (not replacing manual evidence)
4. Appear in the player profile Skill Path tab alongside manual gate evidence
5. Label all Angles-sourced evidence clearly: "From Angles App — [date]"

This must go through the proposed_actions pipeline — no automatic gate confirmation from video evidence alone.

---

## Pilot Plan

For the Dabul Tennis Academy pilot:
- Angles App evidence is **not integrated** in V1
- Coaches can reference Angles observations in free-text notes
- Evidence counts for gate status must be recorded manually via "Record Gate Evidence"
- Full Angles App integration is a V2+ feature

---

## Verdict

**Angles App integration: NOT BUILT in V1.**

The curriculum mapping documentation exists. The integration architecture is clear. Implementation is V2+ work.

For the pilot, coaches should record Angles-derived observations as coach notes and manually record gate evidence when video analysis supports gate passage.
