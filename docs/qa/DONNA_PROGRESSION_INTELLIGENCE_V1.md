# DONNA Progression Intelligence V1 — QA Certification

Sprint 1742

---

## Scenarios

### 1. "Which players are ready to move up?"

**Observation:** Lists all players with `advancementEligible: true` from `playerCurriculumStateSummaries`.

**Confidence:** High (when `playerProgressContextAvailable`), Medium otherwise.

**Evidence shown:** Player names, levels, count of eligible-without-assessment-evidence.

**Limitations shown:** Roster cap (30), advancement-eligible flag accuracy.

**Recommendation:** Review evidence → confirm or defer from player profile.

**Safety:** DONNA never auto-advances anyone. Director confirmation always required.

---

### 2. "Who is stalled?"

**Observation:** Lists all entries from `playerProgressStalls`, grouped by severity.

**Confidence:** High (when `playerProgressStallContextAvailable`), Medium otherwise.

**Evidence shown:** Player name, days at level, severity (high/medium), level.

**Limitations shown:** Stall threshold is 90 days — not every stall is a concern. Roster cap.

**Recommendation:** Review gate evidence → decide: advance, flag for intervention, or leave in progress.

---

### 3. "Player progression overview"

**Observation:** Combines ready + stalled + assessment overdue into one answer.

**Confidence:** Depends on context availability.

**Evidence shown:** All three counts with detail.

**Limitations shown:** Roster cap noted if fewer than total players loaded.

---

### 4. Assessment overdue observation

**Trigger:** `assessmentCoverageGaps` contains entries with `gapType === 'no_recent_assessment'`.

**Observation:** Players with no assessment in 90+ days — surfaced as observation in full report.

**Severity:** Critical if 2+ high-severity gaps, Warning otherwise.

---

## Safety invariants

- No auto-advancement — all player movement requires explicit director action
- No mutations — read-only analysis
- Confidence always stated
- Roster cap disclosed when fewer players loaded than total academy count
