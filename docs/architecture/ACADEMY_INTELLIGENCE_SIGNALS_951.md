# Academy Intelligence Signals V1
**Date:** 2026-05-29
**Sprint:** 951
**Status:** Complete

---

## What Was Built

`src/lib/donna/donnaAcademySignals.ts` — read-only academy signal aggregation.

4 signal types with severity levels (critical/warning/ok/unknown):
- `review_queue` — pending approvals count
- `attendance_exception` — pending attendance exceptions
- `player_evidence` — player development concerns (stalls + high-risk)
- `curriculum_execution` — curriculum draft backlog

`buildAcademySignalSuite(input)` returns all signals + overallSeverity + counts.
No DB calls — uses `DirectorBriefInput` (same as director brief engine).
No automatic actions — signals inform DONNA's recommendations only.
