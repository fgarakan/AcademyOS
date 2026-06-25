# DONNA Live Executive Activation V1

**Mega Sprint 4141–4170 — 2026-06-25**

Activate the Executive DONNA stack in the live Director experience. The Executive
Layer, Context Engine, Dialogue Engine, Operating Session, and Action Loop were
already built and certified (Sprints 3661–4140). This sprint **activates, verifies,
and stabilizes** — no new intelligence, no new memory, no new architecture.

---

## 1. Activation

`.env.local` (local/secret — not tracked):

```
DONNA_EXECUTIVE_REASONING=primary
NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING=primary   # client mirror — same flag
OPENAI_API_KEY=sk-…                              # real key present
```

The **single logical flag** now activates every subsystem through `resolveExecutiveMode()`:

| Subsystem | Gate | Engages in `primary` |
|---|---|---|
| Brain router (executive-first routing) | `isExecutiveReasoningEnabled()` | ✓ |
| Live action / executive bridge | `resolveExecutiveMode()` | ✓ |
| Executive Operating Layer | `isExecutiveReasoningEnabled()` | ✓ |
| OpenAI reasoning gateway | bridge → `runExecutiveOperatingTurn` | ✓ (real `source=openai`) |
| Response Validator | operating layer | ✓ |
| Developer diagnostics / trace | always | ✓ |

---

## 2. Dormancy removal — the live blocker that was fixed

**File:** `src/lib/donna/brain/processDonnaMessage.ts:747` and
`src/lib/donna/brain/donnaCanonicalRouter.ts:204` (executive-first routing).

**Condition:** both modules are **client-bundled** (imported by the
`DonnaAssistantButton` client component). Next.js inlines any non-`NEXT_PUBLIC_`
env var as `undefined` in the browser bundle.

**Effect:** `isExecutiveReasoningEnabled()` → `resolveExecutiveMode()` read only
`process.env.DONNA_EXECUTIVE_REASONING`, which is **invisible to the client**. So in
the live browser the flag always resolved to `off`, executive-first routing never
engaged, and reasoning turns fell through to deterministic engines — even though the
**server action** honored `primary`. The stack was activated on the server but the
client never handed it the turn.

**Fix (one logical flag, no new flag):** `resolveExecutiveMode()` now reads
`DONNA_EXECUTIVE_REASONING ?? NEXT_PUBLIC_DONNA_EXECUTIVE_REASONING`. The server still
prefers the server-only value; the public mirror fills the client gap. Set both to
the same value.

Other paths reviewed and found **correct, not dormant**:
- `donnaStrategicConversationAction` — flag-gated, fail-open; reasoning now reaches
  `live_ai_assist` before the strategic path, so it handles non-executive medium-
  confidence turns as designed.
- Greeting / continuity / save-verification turns are owned by the executive stack's
  **deterministic** components (Operating Session resume, Dialogue continuity, Action
  Loop) — by design, not legacy fallback.

---

## 3. Live trace (developer-only) — full executive chain

`logReasoningTrace` + `ExecutiveLiveDiagnostics` now expose, for every Director turn:
route · classification · executiveAttempted · context sources/packet · page grounding
· **dialogue stage** · **session objective** · **workflow step + blocker** ·
openaiInvoked + realCall · validator disposition · latency · final response source ·
**fallbackReason**.

**No silent fallback (Objective 5):** when legacy answers, the reason is always
stated (`executive turn crashed` · `validator rejected` · `shadow mode` · …) and
`executiveAttempted` stays `true`.

---

## 4. Proof

Real OpenAI through the executive chain on the **exact 7-turn sprint browser script**
(`node --env-file=.env.local --import tsx …donnaLiveExecutiveActivationCertification.ts`):

| Turn | class | realOpenAI | exec path | latency |
|---|---|---|---|---|
| Good morning Donna | deterministic → Operating Session | (no OpenAI by design) | ✓ | — |
| What should I do today? | executive | **YES** | ✓ | ~1.9 s |
| Walk me through this page | executive | **YES** | ✓ | ~2.1 s |
| Continue | deterministic → Dialogue continuity | (no OpenAI by design) | ✓ | — |
| Why? | executive | **YES** | ✓ | ~2.4 s |
| What remains today? | executive | **YES** | ✓ | ~1.9 s |
| Did that save? | deterministic → Action Loop (verifies from events) | (no OpenAI by design) | ✓ | — |

`LIVE OPENAI PROOF: PROVEN ✓` — every reasoning turn `source=openai`.

**Honest scope:** the literal browser shell + Supabase director auth were **not**
exercised (no seeded director credentials in this environment). The proof runs the
exact server pipeline the browser triggers — `runExecutiveLive` →
`runExecutiveOperatingTurn` → OpenAI → Validator — with the real key, which is the
substantive end-to-end path minus the React/auth shell.

---

## 5. Certification

- `donnaLiveExecutiveActivationCertification.ts` — **20/20** with key (19/19 offline,
  +1 live-OpenAI tier), registered in the gate.
- Full suite: **20/20 suites passed**. `tsc --noEmit` clean.
- Live wiring suite: 35/35 offline contract.

**Live DONNA score: 9 / 10** (−1: literal browser+auth shell unproven here).
