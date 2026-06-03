# DONNA Hey Donna Activation Certification V1

**Sprint:** Mega Sprint 1661–1680
**Date:** 2026-06-03
**File:** `src/components/donna/DonnaVoiceReadyShell.tsx` — `HEY_DONNA_PATTERN` intercept

---

## Pattern

```
/^(hey donna|hi donna|hello donna|donna[,.]?\s*$|donna\s+here)/i
```

---

## 1. Activation Phrases

| Phrase | Matches | Status |
|---|---|---|
| "hey donna" | YES | PASS |
| "Hey Donna" | YES (case-insensitive) | PASS |
| "hi donna" | YES | PASS |
| "hello donna" | YES | PASS |
| "donna" (alone) | YES | PASS |
| "donna." | YES | PASS |
| "donna, what's up" | NO — falls to normal routing | PASS (correct) |
| "hi there donna" | NO — falls to normal routing | PASS (correct) |

---

## 2. Context-Aware Response — Player Profile Page

**Setup:** Director is on `/director/players/{id}`. `PlayerProfileDonnaRegistrar` has injected:
```ts
playerProfileContext = {
  activePriorityCount: 2,
  topPriorityTitle: "Forehand consistency",
  topPriorityLevel: "Orange Ball 2",
}
```
`lastObjectLabel` = "Jamie Chen"

**Expected greeting:**
```
You're viewing Jamie Chen's profile. Level: Orange Ball 2. 
Current top priority: Forehand consistency. What would you like to review?
```

**Status: PASS**

---

## 3. Context-Aware Response — Curriculum Page

**Setup:** Director is on `/director/curriculum?improve=orange_ball_2`. `lastObjectLabel` = "Orange Ball 2"

**Expected greeting:**
```
You're currently reviewing Orange Ball 2. I can show current state, evidence signals, 
and improvement suggestions. What would you like to explore?
```

**Status: PASS**

---

## 4. Context-Aware Response — Dashboard with Pending Work

**Setup:** Director is on `/director`. `directorCtx.pendingReviews = 3`, `highRiskPlayerCount = 1`.

**Expected greeting includes:**
- "You're on Director Dashboard."
- "3 items need your review."
- "1 high-risk player signal active."
- "What would you like to do?"

**Status: PASS**

---

## 5. Fallback — No Entity Context

**Setup:** Director is on `/director/sessions`. No player context. No pending work.

**Expected greeting:**
```
You're on Sessions. [page intent from capability map] What would you like to do?
```

**Status: PASS**

---

## 6. Position in Routing Pipeline

"Hey Donna" intercept fires after:
- Pending confirmation check (so "hey donna" doesn't accidentally cancel a pending action)
- Pending nav offer check
- Boundary check

"Hey Donna" fires before:
- Review queue intelligence
- Director intelligence brief
- Page guide
- All domain interceptors

This ordering ensures the greeting is never intercepted by downstream handlers.

**Status: PASS**

---

## 7. No Generic Response

DONNA never responds to "Hey Donna" with:
- "How can I help?"
- "Hello! What would you like to know?"
- Any generic non-contextual text

The greeting always references the current page or entity context.

**Certification: PASS**
