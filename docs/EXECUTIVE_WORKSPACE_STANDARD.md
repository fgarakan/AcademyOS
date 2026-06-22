# Executive Workspace Standard

**Status:** APPROVED TARGET ARCHITECTURE — ratified product philosophy, converging implementation.
**Scope:** Every AcademyOS UI sprint, every DONNA surface, every role portal.
**Required reading:** Before any UI, DONNA, or workflow sprint. Read after `AI_BACKEND_RULES.md` and before `CURRENT_BUILD_TARGET.md`.
**Origin:** Convergence work following the DONNA UI-responsibility and workflow-completion audits (`docs/audit/DONNA_UI_RESPONSIBILITY_AUDIT_V1.md`, `docs/audits/DONNA_WORKFLOW_COMPLETION_AUDIT_1025.md`), which found the DONNA sidebar had begun to evolve into a second application.

This document is not a redesign, a feature spec, or an architecture expansion. It is a **product-philosophy lock**. It exists to make one question always have an obvious answer:

> "Where do I complete this?"

**Read this first — what this document is and is not.** The **philosophy** (sections 0–13 below) is **locked**: it is the ratified, non-negotiable direction for AcademyOS. The **implementation** is allowed to converge toward it over multiple sprints. This is a product constitution, not implementation documentation. Its purpose is to define **where AcademyOS is going**, not to claim that every screen already satisfies it. The Implementation Status block immediately below is the only part that describes present-day reality; it changes as the codebase converges. When conformance reaches 100% and `ExecutiveWorkspaceCertification` passes, the Status line above is promoted to **PERMANENT PRODUCT LAW**.

---

## Implementation Status

> This block is the single source of truth for how far the codebase has converged toward the locked philosophy. It is expected to change every sprint. The philosophy in sections 0–13 does **not** change with it.

### Current implementation maturity

| Layer | Maturity | Notes |
|---|---|---|
| Philosophy / law (§0–13) | **Ratified** | Locked. The target every DONNA surface converges toward. |
| Navigation & handoff infrastructure | **Built** | `donnaDraftPersistence.ts`, `DonnaHighlightBanner.tsx`, prefilled-page handoffs exist and work. |
| Page-owned completion | **Partial** | Owning pages exist for major workflows, but completion is not yet exclusive to them. |
| Sidebar containment (no mutation / no editor / no completion) | **Not yet met** | The `DonnaAssistantButton` render tree still hosts draft editors, apply controls, and committing actions. See Known gaps. |
| `ExecutiveWorkspaceGuardian` (the §12 certification) | **Built** | Guardian #1 of the AcademyOS Guardian Framework (`src/lib/guardians/`). Read-only; observes · classifies · certifies · reports · blocks regressions. Runs GREEN on a ratchet-only baseline of 38 accepted backlog violations; a new sidebar mutation/editor/multi-step/completion control fails CI (exit 1). The §12 100% ship-gate is now the convergence target as the baseline shrinks to zero. |

### Conformance status

**Overall: NON-CONFORMANT — actively converging.** The philosophy is approved and binding as direction; the implementation does not yet satisfy the hard rules in §2. No sprint may add *new* violations; existing violations are retired per the roadmap below.

### Known gaps (present-day violations of §2 / §7)

Verified against the `src/components/assistant/` render tree:

1. **Committing actions in the sidebar tree.** ~20 server actions matching the §2 forbidden pattern are reachable from the widget — e.g. `saveSessionDraftAction`, `saveAttendanceExceptionDraftAction`, `routeVoiceNoteToPlayerAction`, `markVoiceNoteReviewedAction`, `finalizeStaleSessionAction`.
2. **High-risk apply controls in the sidebar.** `applyApprovedLevelMovementAction` / `applyApprovedCurriculumAdjustmentAction` (and `DonnaLevelMovementApplyControls`, `DonnaCurriculumAdjustmentApplyControls`) are reachable from the widget — a direct violation of §7.4, which forbids high-risk core mutations from the sidebar entirely.
3. **Editors in the sidebar.** Content-editing inputs exist in `DonnaMessageReviewPanel`, `DonnaReviewQueuePanel`, `GenericDraftPanel`, and `TemplateDraftPanel` — beyond the §2 voice + single answer-confirm exceptions.
4. **Draft-capture vs. completion is undifferentiated.** Some `save*DraftAction` calls only capture a draft into the sanctioned `proposed_actions` pipeline. The §2 / §12 regex currently bans these wholesale; the certification (when built) must distinguish *draft capture* (allowed, read-through to a page) from *completion / apply / approve* (forbidden in the sidebar) so the standard does not contradict the `proposed_actions` path it exists to protect.

### Migration roadmap

Convergence to 100% proceeds in named sprints; no big-bang rewrite:

1. **Build the certification first — as a permanent guardian, not a one-off. ✅ DONE.** Implemented as the **AcademyOS Guardian Framework** (`src/lib/guardians/`) with `ExecutiveWorkspaceGuardian` as Guardian #1, encoding the §12 sidebar-containment checks over the assistant render tree. Read-only and ratchet-only from day one: GREEN on a 38-item accepted baseline, exit 1 on any new violation. Run: `npx tsx src/lib/guardians/runGuardians.ts`.
2. **Reclassify draft capture vs. completion.** Refine the rule (and §12 wording) to permit draft capture into `proposed_actions` while forbidding completion/apply/approve in the sidebar. Re-baseline the gap list against the corrected rule.
3. **Move apply controls to their owning pages.** Retire `DonnaLevelMovementApplyControls` / `DonnaCurriculumAdjustmentApplyControls` from the widget; the sidebar's terminal action becomes navigation to the page that owns the apply. Closes §7.4 violations first (highest risk).
4. **Move editors to pages.** Replace in-sidebar draft editors with read-only previews + prefilled-page handoffs (infra already exists via `donnaDraftPersistence`).
5. **Retire remaining committing actions from the sidebar tree** until the certification is GREEN.
6. **Promote status.** When `ExecutiveWorkspaceCertification` = 100% and zero regressions, change the Status line to **PERMANENT PRODUCT LAW**.

### Target certification

The conformance gate is **`ExecutiveWorkspaceCertification`** as specified in §12 (target 100%) and governed as a permanent architectural guardian in §13. It does not exist yet; building it is roadmap step 1. Until it passes at 100%, this document remains **APPROVED TARGET ARCHITECTURE**, not law. After promotion it does not retire — it stays as a permanent quality gate and expands across the Cognitive Load, DONNA Guidance, Page Ownership, and Information Hierarchy standards (§13).

---

## 0. The Law (one sentence)

> **Conversation happens with DONNA. Work happens on pages. DONNA guides between them.**

The sidebar never becomes a second application. If a Director can finish a unit of work without leaving the DONNA sidebar, the law is broken.

---

## 1. Product philosophy (lock)

AcademyOS exists to **minimize cognitive load**. The Director is an executive, not a data-entry operator. Every interaction must move the Director toward feeling *"I'm talking with my COO,"* never *"I'm using a chatbot."*

Three permanent commitments:

1. **One obvious place.** Every workflow has exactly one owning page. The Director never wonders where to complete something.
2. **Conversation ≠ workspace.** DONNA reasons, prioritizes, recommends, navigates, and guides. DONNA does not host the work.
3. **Provenance is sacred.** Every mutation originates from a page and flows through `proposed_actions` or writes `audit_logs`. (Reinforces `AI_BACKEND_RULES.md`.)

---

## 2. Sidebar responsibilities

The DONNA sidebar / floating widget (`DonnaAssistantButton` and anything it renders) owns **ONLY**:

| Allowed | Definition |
|---|---|
| Conversation | Chat thread, voice, transcript, a single answer-confirm field |
| Executive brief | Daily/COO brief, attention summary, status counts |
| Recommendations | "Here's what I'd do next" + reasoning |
| Navigation | `<Link>` / `router.push` handoffs to owning pages |
| Voice | Wake word, dictation, read-aloud |
| Status | "Step 2 of 4 — Open workspace →" chips, queue counts |
| Lightweight preview | **Read-only** draft preview with the standard "nothing saves until you approve on screen" disclaimer |

The sidebar **NEVER** owns:

> forms · editors · approvals · evidence review · creation · progress trackers · draft workspaces · completion · save · submit · apply · approve · queue · review · multi-step state

**Hard rules (enforceable):**

- **No mutation in the sidebar.** No component in the `DonnaAssistantButton` render tree may call a committing server action (name matching `/^(save|create|apply|update|route|queue|finalize|execute|approve|reject|mark).*Action$/`). The sidebar's only terminal control is navigation.
- **No editor in the sidebar.** No `<input>`, `<textarea>`, or `<select>` that edits an artifact's content. The **sole** exceptions: voice capture and a single answer-confirm field that feeds a conversation turn.
- **No multi-step state in the sidebar.** No step counters, progress/coverage bars, or "Step X of Y" workspaces. A read-only status chip with a handoff link is the maximum.
- **Preview ≤ glance.** Previews are read-only and disclose that nothing is saved.

---

## 3. Page responsibilities

The owning page holds everything the sidebar may not:

> state · editing · field validation · multi-step flow · evidence · completion · **save · submit · apply · approve** · mutations · audit trail

Every workflow has **exactly one** owning page. The page is where thinking becomes work and work becomes a record.

---

## 4. DONNA's role

DONNA is the **executive guide**, not the workspace.

DONNA does: **Understand → Prioritize → Recommend → Navigate → Highlight → Explain → Guide → Confirm.**

DONNA never: owns the workflow · holds form state · executes the final mutation · renders the editor.

DONNA's job ends at the page boundary: it opens the right page, highlights the relevant area, narrates the next step, and confirms completion after the page does the work.

---

## 5. Workflow contract

Every workflow MUST follow this shape:

```
User asks
   ↓
DONNA understands
   ↓
DONNA recommends
   ↓
Navigate (DONNA hands off)
   ↓
Correct page opens
   ↓
Relevant area highlighted
   ↓
DONNA guides
   ↓
Page updates live
   ↓
Completion (on the page)
   ↓
Confirmation (DONNA acknowledges)
```

**Forbidden shape:**

```
User → Sidebar → Complete workflow
```

If completion happens before navigation, the workflow is non-compliant.

---

## 6. Navigation rules

1. The sidebar's terminal action is **always** navigation (`<Link>` / `router.push`), never a mutation.
2. Navigation carries draft context forward (sessionStorage via `donnaDraftPersistence`) so the page opens prefilled — the Director never re-enters what they told DONNA.
3. On arrival, the page highlights the relevant area (existing `DonnaHighlightBanner` / focus-ring pattern).
4. Handoff copy is explicit and singular: "Open in Template Builder →", "Review & approve →", "Open workspace →".

---

## 7. Completion rules

1. Completion (save/submit/apply/approve) happens **only** on the owning page.
2. The mutation originates from a page-level control and flows through `proposed_actions` or writes `audit_logs`.
3. After the page completes, DONNA may acknowledge ("Done — the template is live") but performs no write.
4. High-risk core mutations (player level movement, curriculum override, player activation) are **never** reachable from the sidebar. These remain gated to their dedicated page controls and the canonical functions (`finalize_player_placement()`, `execute_approved_action()`).

---

## 8. Progressive disclosure

- The sidebar shows the **least** needed to decide: a recommendation, a one-glance preview, a handoff.
- Depth (fields, evidence, history, multi-step) lives on the page and is revealed there.
- The Director is never shown a workspace they didn't navigate to.
- Status chips summarize; they never expand into the work itself.

---

## 9. Cognitive load principles

1. **One owning page per workflow** — no "where do I finish this?"
2. **Talk in the sidebar, work on the page** — a stable mental model that never inverts.
3. **No duplicated surfaces** — a workflow's controls exist in exactly one place.
4. **Prefilled handoffs** — DONNA carries context so the page never asks twice.
5. **COO, not chatbot** — DONNA recommends and delegates; it does not turn the Director into an operator.

**Lowest-cognitive-load test** — for every workflow answer three questions:

- Where does *thinking* happen? → Sidebar (with DONNA).
- Where does *work* happen? → Page.
- Where does *completion* happen? → Page.

If work or completion happens in the sidebar: **FAIL.**

---

## 10. Component ownership taxonomy

Every DONNA component is classified with **no ambiguity**:

| Class | Meaning | May mutate? | May render editor/stepper? |
|---|---|---|---|
| **Sidebar** | Conversation / brief / recommendation / status / preview / nav | No | No |
| **Page** | Owning workspace for a workflow | Yes (page-gated, via `proposed_actions`/`audit_logs`) | Yes |
| **Shared** | Read-only display used by both sidebar and page (e.g. preview cards) | No | No |
| **Infrastructure** | Engines, contracts, routers, registries (no UI) | No | No |
| **Conversation** | Chat thread, voice, transcript | No | No (single answer-confirm field only) |
| **Delete** | Dead code or duplicated workspace to remove | — | — |

A component may not hold two classes. A "Shared preview" that gains a save button becomes a "Page" component and must move to the page.

---

## 11. Executive experience standard

Every recommendation must move the Director toward **"I'm talking with my COO."**

- COO: "Eight reviews are waiting; the oldest is 12 days. Want me to open the queue?" → handoff.
- Chatbot: a form sprouting inside the chat with a Save button.

The sidebar advises and delegates. The page executes. That division is what makes DONNA feel like an executive partner rather than a tool.

---

## 12. Certification requirements

A sprint that touches a DONNA surface is not complete until **ExecutiveWorkspaceCertification** passes at 100%. The certification verifies:

```
✓ No sidebar mutations      — no committing server action in the sidebar render tree
✓ No sidebar editors        — no content-editing inputs in the sidebar (voice + answer-confirm excepted)
✓ No sidebar workflows      — no multi-step/progress-tracker state in the sidebar
✓ No sidebar completion     — no save/submit/apply/approve/queue terminal controls in the sidebar
✓ Every workflow has one owner — exactly one owning page per workflow
✓ Every mutation originates from a page — and flows through proposed_actions / audit_logs
✓ DONNA only guides         — sidebar terminal action is navigation
```

**Target: 100%. No exceptions ship below 100%.**

Validation per sprint:
- `npx tsc --noEmit` clean.
- All existing `src/lib/donna/certification/*` and `*Certification.ts` suites pass — zero regressions.
- `ExecutiveWorkspaceCertification` passes at 100%.

---

## 13. The certification as permanent architectural guardian

`ExecutiveWorkspaceCertification` is **not a one-off test suite**. It is a **permanent architectural guardian** — a standing quality gate that every future UI sprint runs against, for the life of the product.

**Its purpose is not to find violations. Its purpose is to prevent architectural drift.** Finding a violation is the mechanism; keeping AcademyOS from accidentally becoming worse is the goal. The product should grow *increasingly difficult to degrade*: each standard the guardian encodes is a regression that can no longer be reintroduced by accident.

**Permanent quality-gate status (locked):**

1. The certification is part of AcademyOS's **permanent quality gates**, alongside `npx tsc --noEmit` and the existing `*Certification.ts` suites. It runs on every UI/DONNA/workflow sprint, not only when this standard is edited.
2. **A PR fails if it introduces new sidebar workflow ownership** — any new mutation, editor, multi-step state, or completion control in the sidebar render tree is a hard failure, regardless of conformance backlog. The backlog only ever shrinks; new violations are never admitted (the "no new violations" rule in the Implementation Status block, made enforceable).
3. The guardian is **ratchet-only**: once a check reaches GREEN it stays GREEN. Regressions are blocked, not negotiated.

**Planned scope expansion (the guardian grows to protect the whole product philosophy):**

The certification begins by enforcing the Executive Workspace Standard and expands, standard by standard, to continuously enforce AcademyOS's product philosophy as a whole:

| Standard | What the guardian protects | Status |
|---|---|---|
| **Executive Workspace Standard** | Sidebar never owns work; one owning page per workflow; mutations flow through `proposed_actions` / `audit_logs` | Primary — this document |
| **Cognitive Load Standard** | The Director is an executive, not an operator; least-needed-to-decide; no duplicated surfaces | Planned |
| **DONNA Guidance Standard** | DONNA understands → recommends → navigates → guides → confirms; never hosts the work or executes the final mutation | Planned |
| **Page Ownership Standard** | Every workflow resolves to exactly one owning page; no orphaned or duplicated completion surfaces | Planned |
| **Information Hierarchy Standard** | Progressive disclosure; depth lives on the page; the sidebar summarizes and hands off | Planned |

**Long-term goal:** AcademyOS **continuously enforces its own product philosophy.** The guardian is how the constitution defends itself between Director reviews — drift is caught by the gate, not by hoping each sprint remembers the rules.

---

## 14. Amendment policy

This is a constitution. It changes only by an explicit, named convergence sprint with Director approval. Feature sprints inherit it; they do not relax it. When in doubt, the sidebar does less and the page does more.
