# DONNA Curriculum Bottleneck Intelligence V1 — QA Certification

Sprint 1743

---

## How bottleneck score is computed

Composite proxy score per level (higher = more bottleneck signals):

| Signal | Score contribution |
|---|---|
| Player stall at level (medium severity) | +1 |
| Player stall at level (high severity) | +3 |
| No template assigned | +4 (high) / +2 (medium) / +1 (low) per gap severity |
| Structural curriculum gap (no drills/gates) | +2 |
| Assessment overdue at level | +1 |

Levels sorted by total score descending. Top 3 shown.

---

## Scenarios

### 1. "Which levels are bottlenecks?"

**Observation:** Top 3 levels by bottleneck score with per-signal breakdown.

**Example output:**
```
Observation:
3 curriculum levels show bottleneck signals.

Orange Ball 2
  • 4 players stalled
  • No class template assigned
  • 2 structural gaps in curriculum content

**Confidence:** Medium

Evidence:
• 8 player progress stalls
• 3 curriculum-template coverage gaps
• 2 structural curriculum gaps

Limitations:
• Bottleneck score is a composite proxy — not a measured session progression rate.
• Only 18 of 25 players in loaded context.
• No historical data used — this is a point-in-time snapshot.

Recommendation:
Review Orange Ball 2 first — highest combined bottleneck score. Assign a class template if missing, and check gate evidence for stalled players.
```

### 2. "Which curriculum needs improvement?"

Detected by same `curriculum_bottleneck` intent pattern. Returns same analysis.

### 3. No bottleneck signals

DONNA responds with honest "no signals detected" + limitations note.

---

## Safety invariants

- No automatic curriculum changes — all curriculum edits require director/voice approval pipeline
- Score is clearly labeled as "proxy" not a measured rate
- Historical comparison explicitly disclaimed
