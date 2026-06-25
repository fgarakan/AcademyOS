# DONNA Reasoning Constitution V1

**Mega Sprint 3901–3930** · 2026-06-25 · Status: **RATIFIED + CERTIFIED (132/132 new; 13/13 gate suites green)**

> The permanent routing law for DONNA. Executive reasoning is the default for
> reasoning requests; OpenAI is the primary reasoning engine; AcademyOS remains the
> source of truth and execution engine. Every Director request is classified
> **before** routing as `deterministic`, `executive`, or `hybrid`.

---

## 1. The Constitution — who owns what

| Owner | Owns |
|---|---|
| **AcademyOS** | data · permissions · workflows · validation · execution · approvals · audit trail · CRUD |
| **OpenAI** | reasoning · judgment · prioritization · planning · recommendations · explanations · comparisons · conversation · coaching · teaching · diagnosis · executive summaries |
| **DONNA** | orchestration · context assembly · tool selection · workflow execution · conversation continuity · response validation |

Encoded as `ROUTING_CONSTITUTION` in `src/lib/donna/constitution/donnaRoutingConstitution.ts`.

---

## 2. The classifier — one front door

`classifyRequest(text)` (`src/lib/donna/constitution/donnaRoutingConstitution.ts`) is
the single, pure, total classifier. It composes the already-shipped, already-certified
detectors so its decision is identical to the live router — it is the single *name*
for that decision, not a competing classifier:

- **execution intent** — `detectDirectMutationRequest` (approval-gated mutations) + an
  execution/CRUD verb vocabulary (`save, update, delete, assign, approve, archive,
  create, publish, navigate, execute, run, schedule, …`).
- **reasoning intent** — `classifyExecutiveConversation` (the conservative executive
  classifier) + a reasoning-ask vocabulary (`explain, why, recommend, compare,
  summarize, teach, coach, diagnose, plan, justify, …`).

### Decision order (most-specific first)

```
1. execution verb AND reasoning ask        → hybrid        (reason first, execute second)
2. execution / CRUD or approval-gated mut. → deterministic (AcademyOS executes — NEVER OpenAI)
3. reasoning ask                           → executive     (Executive Operating Layer → OpenAI)
4. neither (narrow lookup / unclassified)  → deterministic (AcademyOS data answer)
```

Total: every input — including empty string — resolves to exactly one class.
Deterministic: same input always yields the same class.

---

## 3. The three routes

### Executive (reasoning) — Objective 2
```
Intent → Context Resolver → Executive Context Packet → OpenAI → Validator → Action Planner
```
`What should I do? · What should I focus on? · Why? · Compare… · Recommend… · Explain… ·
Teach… · Coach… · Plan… · Diagnose… · Review… · Summarize…` — always executive.

Live wiring: in **primary** mode the canonical router (Step 1.6) defers
(`stage=executive_reasoning`) and the brain (Step 2.5) returns `live_ai_assist`, which
the live action runs through the Executive Operating Layer (real OpenAI, proven in the
3811–3870 activation traces).

### Deterministic (execution) — Objective 3
`Save · Update · Delete · Assign · Approve · Archive · Create record · Navigate ·
Execute workflow` — execute directly through AcademyOS, **never** call OpenAI.
Approval-gated mutations are intercepted by the safety pipeline first (`safety_block` →
review queue), never executed directly.

### Hybrid — Objective 4
`"Create an Orange 2 template and explain why."` — OpenAI reasons, AcademyOS executes,
DONNA validates. Classified `hybrid`; routed through the executive layer for reasoning
while execution remains on the approval-gated draft path.

---

## 4. Developer visibility — Objective 6

`logRoutingDecision()` (`src/lib/donna/constitution/donnaRoutingLog.ts`) emits a
developer-only line (server console, never client, off in production unless
`DONNA_ROUTING_DEBUG=1`):

```
[donna.constitution] entry=live_action class=executive goal=prioritize exec=false reason=true
  mutationGated=false decision=executive_layer openai=YES mode=executive
```

Wired at the live entry point (`donnaLiveConversationAction.ts`) for every turn:
classification · routing decision · OpenAI invoked · execution mode · fallback reason.

---

## 5. Entry-point audit

| Entry point | Path | Routes through | Constitution status |
|---|---|---|---|
| Live AI conversation (Director/Head Coach) | `src/app/director/_actions/donnaLiveConversationAction.ts` | canonical brain → executive layer (primary) | ✅ classified + logged |
| Canonical router (frontend decision) | `src/lib/donna/brain/donnaCanonicalRouter.ts` | `classifyRequest` (Step 1.6) | ✅ classifies before routing |
| Canonical brain | `src/lib/donna/brain/processDonnaMessage.ts` | `classifyRequest` (Step 2.5) | ✅ executive-first via constitution |
| OpenAI gateway (single) | `donnaOpenAIGateway` → `askConversationTeacher` | one gateway, never bypassed | ✅ unchanged |
| Strategic AI conversation | `src/app/director/_actions/donnaStrategicConversationAction.ts` | `strategic_ai_assist` (brain Step 13.5) | ⚠️ remaining exception (§6) |

Non-conversational OpenAI callers (out of scope — not request routing): learning
analyzer + knowledge draft generator (background enrichment), TTS / Whisper transcribe /
realtime voice (media). Orphaned deletion-candidate `donnaSaveAcademySetupDraftAction.ts`
left untouched.

---

## 6. Remaining exceptions (documented, not silently bypassed)

1. **`strategic_ai_assist` path** (`processDonnaMessage` Step 13.5 →
   `donnaStrategicConversationAction` → OpenAI) is a *second* reasoning path that calls
   OpenAI **without** going through the Executive Operating Layer. It is gated by a
   confidence zone (0.35–0.72), not the constitution classifier. Future migration:
   fold strategic reasoning into the executive layer so there is exactly one reasoning
   pipeline. Until then it is a known, bounded exception.
2. **Confidence gates** in `donnaConversationTeacher` (≥0.75) and
   `donnaLearningAnalyzer` (≥0.50) independently decide whether to call OpenAI for
   their narrow tasks. They are sub-engine economizers, not request routers; left as-is.
3. **Mutation detector coarseness** — `detectDirectMutationRequest` matches whole-word
   `parent`, so plural/edge phrasings (e.g. "send it to the parents") are not caught as
   approval-gated mutations. Pre-existing (see `KNOWN_LIMITATIONS.md` — "exception
   specificity is coarse"); the constitution inherits its coverage. Out of scope here.
4. **Flag dependency** — executive routing engages only when
   `DONNA_EXECUTIVE_REASONING=primary`. With the flag off/unset, reasoning requests fall
   back to the deterministic engines (today's legacy behavior). Certified in section G.

---

## 7. Certification results

`src/lib/donna/certification/donnaRoutingConstitutionCertification.ts` —
**132/132 (100%)**, offline + deterministic (CI-gating, no key required):

- **A** classifier totality + determinism
- **B** reasoning → executive (classifier + router Step 1.6 + brain Step 2.5, primary)
- **C** CRUD → deterministic, never executive, never `live_ai_assist`
- **D** approval-gated mutations → deterministic + `safety_block`
- **E** hybrid → reason-then-execute
- **F** no conflicting decisions (no reasoning→deterministic, no CRUD→executive)
- **G** flag-off preserves the legacy baseline (zero behavior change)

Full gate after wiring: **13/13 suites green** (the 12 pre-existing suites unchanged —
broadening executive routing caused no regression).

---

## 8. The developer test (Objective: SUCCESS)

> *"Is this reasoning or execution?"* — reasoning → OpenAI; execution → AcademyOS; both →
> OpenAI then AcademyOS.

`classifyRequest()` answers it for every request, before routing, with no exceptions
beyond those documented in §6.
