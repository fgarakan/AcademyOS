# TARGET USERS AND ROLES

## The 5 Roles

### 1. Academy Director
The business operator. Sees the whole academy as one organism.
- Needs: operational intelligence, retention metrics, enrollment data, program performance
- Fears: families leaving, program gaps they can't see, coach underperformance
- Voice use: "How is the Level 3 program performing?", "Which families are at risk of leaving?"
- V1 features: intelligence dashboard, retention signals, configuration

### 2. Head Coach
The program leader. Owns placement, promotion, and curriculum quality.
- Needs: placement approvals, cross-player pattern detection, group management, curriculum oversight
- Fears: wrong placements, coaches not observing players, inconsistent development
- Voice use: "Flag all players overdue for reassessment", "Show me Elite-A's common weaknesses"
- V1 features: placement queue, pattern surface, group view, promotion readiness

### 3. Coach
The daily practitioner. On the court. Needs minimum friction.
- Needs: pre-session brief, voice note capture, player cards, session structure, assessment tool
- Fears: forgetting what they observed, writing parent updates from scratch, not knowing what to focus on
- Voice use: "Note for Alex: backhand improvement significant today, serve still inconsistent" (V2)
- V1 features: session builder, written observations, assessment scoring, parent update approval

### 4. Player (read-only)
Wants to see progress, understand priorities, know they're on track.
- Needs: development dashboard, progress timeline, current focus areas, session history
- Fears: not knowing how they compare to the group, feeling like placement was arbitrary
- V1 features: profile view, assessment timeline, focus areas, session feed (read-only)

### 5. Parent (V2)
Paying the fees. Needs to feel the investment is worth it.
- Needs: regular progress updates, intake explanation, coach comments, reassessment results
- Fears: silence, doubt, feeling like their child is being ignored
- V1 features: NONE (deferred to V2 — focus on staff workflow first)
- V2 features: parent portal, AI-drafted progress updates, coach comments feed

## Role Hierarchy

```
Academy Director
  └── Head Coach
        └── Coach
              └── Player ← read-only
                  Parent ← read-only (V2)
```

## Multi-role support

A user can hold multiple roles (e.g., a head coach who also coaches a group). The system must support multiple memberships per user.
