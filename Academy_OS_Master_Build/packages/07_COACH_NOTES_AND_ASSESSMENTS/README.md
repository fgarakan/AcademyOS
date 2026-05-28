# Package 07 — Coach Notes and Assessments
**Status:** Draft v1.0

## Key rules
- Internal coach notes and parent-facing updates MUST be separate
- Parent version is AI-generated from internal notes, not a copy of them
- Voice notes go through: audio → transcript → AI parse → observation → (optionally) parent_update

## Contents

| File | Purpose |
|---|---|
| `COACH_NOTES_SPEC.md` | Full spec: observations, visibility, structured assessment form, parent update generator |

## Core objects (defined in DB Package 02)
- `coach_observations`
- `voice_notes`
- `parent_updates`
- `assessments` (shared with Package 04)
