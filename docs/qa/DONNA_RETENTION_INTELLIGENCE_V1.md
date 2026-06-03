# DONNA Retention Intelligence V1 — QA Certification

Sprint 1745

---

## Critical data limitation

`DirectorDonnaContext` does NOT include:
- Player departure records
- Churn history or rates
- Departure reason tags (moved, cost, scheduling, injury, etc.)
- Historical player counts for trend analysis

**All retention signals are proxies derived from available data.**

---

## Proxy signals used

| Proxy | Source | Interpretation |
|---|---|---|
| High-severity stalls (180+ days) | `playerProgressStalls` | Elevated disengagement risk |
| Attendance exceptions | `attendanceExceptions` | Possible scheduling or motivation issues |
| Level clustering (>40% at one level) | `playerCurriculumStateSummaries` | Possible bottleneck-driven attrition |

---

## Scenarios

### 1. "Why are players leaving?"

**Honest response:**

```
Observation:
No actual departure data is available. Showing retention risk proxies only.

Confidence: Medium (or Low if stall data unavailable)

Evidence:
• N stalled players (X high-severity)
• Y pending attendance exceptions
• Z total active players

Limitations:
• No actual departure records or churn history in current context.
• Departure reason tags not available.
• Stall duration is a proxy — some players may be content at their level.

Recommendation:
Start with high-severity stalled players — review profiles and consider parent development conversation.
```

### 2. Level clustering detected

When >40% of loaded players are at one level:
- Severity: `info`
- Message: "High concentration at [level] may indicate a bottleneck contributing to attrition."
- Recommendation: Review level curriculum for clarity and achievability.

### 3. No risk signals

DONNA responds: "No strong retention risk signals detected." With explicit note that actual departure data is not available.

---

## Framing standard

- Never "players are leaving because of Coach X"
- Frame as "development health signals" not churn accusations
- Always disclose that these are proxies, not departure records

---

## Safety invariants

- No fake churn rates
- No departure reason tags without actual data
- Limitation explicitly stated in every response
- Confidence: Medium when stall data available, Low otherwise
