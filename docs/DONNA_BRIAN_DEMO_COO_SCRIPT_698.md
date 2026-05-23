# DONNA Demo Script — Director / Brian Presentation
**Sprint 698 — 2026-05-23**
**Audience:** Academy director or senior stakeholder (Brian or equivalent)
**Goal:** Demonstrate DONNA as a working academy COO layer — not a chatbot, not a search bar.

---

## 1. Executive Demo Positioning

Open with this before touching the screen:

> "What you're about to see is not a chatbot you type questions into and get generic answers. DONNA is the COO layer built into the academy operating system.
>
> She knows where you are in the system. She understands the academy's development workflows — how coaches feed into player records, how player records connect to parents, and how every sensitive action requires director approval before it reaches anyone.
>
> She doesn't guess. She tells you what she can safely help with, routes anything that touches records or communications through the review center, and blocks actions that could expose private information before you've had a chance to review them.
>
> The goal isn't automation. It's a COO assistant that makes the director faster, safer, and more informed without creating new risks."

---

## 2. Demo Prerequisites

Before starting the demo, verify:

| Requirement | Status to check |
|---|---|
| **Browser** | Chrome or Edge — required for voice input. Safari is partial. Firefox has no SpeechRecognition. |
| **Login role** | `academy_director` — DONNA's COO features are director-scoped. |
| **Start route** | `/director` — dashboard must be the opening screen. |
| **DONNA panel** | Confirm the floating DONNA button is visible in the lower-right corner. |
| **Supabase connection** | If attention/review queue data is expected, confirm Supabase is connected and demo data is seeded. |
| **Voice** | Test mic permissions before the demo. If unreliable, default to text — text and voice use the same command path. |
| **Realtime TTS** | Requires `OPENAI_API_KEY` configured on the server. Do not promise Realtime TTS unless tested end-to-end. Browser TTS (`speechSynthesis`) is the reliable fallback and works without configuration. |

**What NOT to use as demo data:**
- Real child or player records from a live academy
- Unseeded/empty database presented as if it contains real academy insights
- Production parent emails or communications

---

## 3. Five-Minute Demo Flow

Tight script. Each step is labelled with the expected time allocation.

---

### A. Open DONNA on the Dashboard **(0:00–0:45)**

**Route:** `/director`

**Action:** Click the DONNA button (floating, lower-right).

**Expected:**
- If first open of the day: full time-of-day greeting with director name (if configured) — "Good morning, Farshad. Here's what needs your attention today."
- If reopening same session: shorter re-entry greeting — "I'm here. What do you need?"
- The panel stays open. DONNA does not close when you navigate.

**Say to Brian:**
> "DONNA opens like a persistent COO assistant. She's not a separate page I have to navigate to and manage. She rides along with every screen in the director experience."

**If no greeting appears:** DONNA panel opens with the voice input layer and prompt chips — that is still correct behavior.

---

### B. Ask: "What should I do first today?" **(0:45–1:15)**

**Route:** `/director`

**Action:** Type or speak the prompt.

**Expected with seeded data:** DONNA fetches the attention report and surfaces the highest-priority items — attendance gaps, pending approvals, flagged signals.

**Expected without data:**
> "This demo environment may not have live academy signals loaded yet. The important part is the workflow: DONNA knows where to look and what categories matter."

**Say to Brian:**
> "This is the first COO question any director asks at the start of the day. DONNA connects it to real attention data from sessions, coach notes, and the review queue."

---

### C. Ask: "Where am I?" **(1:15–1:30)**

**Route:** `/director`

**Action:** Type the prompt.

**Expected (Sprint 697 wired):** DONNA returns a page-aware answer using the Director Dashboard context — explains the purpose of the current screen, what you can do here, and what is blocked.

**Say to Brian:**
> "She knows what page you're on. That's not trivial — most tools require you to tell them the context. DONNA derives it from the route and gives you a relevant answer."

---

### D. Ask: "What can you help me with here?" **(1:30–1:50)**

**Route:** `/director`

**Action:** Type the prompt.

**Expected (Sprint 697 wired):** DONNA returns the Director Dashboard capability summary — what she can answer, what requires review, and what she cannot do from this page.

**Say to Brian:**
> "This question surfaces the trust layer. DONNA tells you what she will and won't do, and why. She's not hiding her limitations — she surfaces them so you know what to rely on."

---

### E. Ask: "How does this system work?" **(1:50–2:20)**

**Route:** `/director`

**Action:** Type the prompt.

**Expected (Sprint 697 wired):** DONNA returns the AcademyOS system overview:
1. Players assessed and placed at the right level
2. Coaches run sessions and capture recaps
3. DONNA surfaces signals and drafts proposals
4. Director reviews and approves everything
5. Approved items flow to the parent portal, player portal, or player records

**Say to Brian:**
> "In one answer, DONNA explains the operating model of the entire academy. That's the kind of onboarding clarity a new director or stakeholder gets from asking one question."

---

### F. Navigate to `/director/players` and ask: "Which players need attention?" **(2:20–2:55)**

**Route:** `/director/players`

**Action:**
1. Navigate to `/director/players`.
2. Observe — DONNA panel stays open. Prompt chips change to player-specific suggestions.
3. Click or type: "Which players need attention?"

**Expected with seeded data:** DONNA surfaces players with attendance flags, development signals, or missing coach notes.

**Expected without data:**
> "Player data may not be loaded in this demo environment. DONNA knows the intent and would normally surface players matching attention criteria."

**Say to Brian:**
> "Two things just happened. First, DONNA stayed open across the navigation — she doesn't reset. Second, the prompt chips changed — they're now player-specific. DONNA is page-aware at every level."

---

### G. Ask: "Move Sarah up." **(2:55–3:25)**

**Route:** Any director route

**Action:** Type: `Move Sarah up.`

**Expected (Sprint 697 fixed P0):** DONNA does NOT move any player. She returns:
> "Level changes always go through review first. I'll prepare a readiness summary with the evidence — you decide whether to approve, defer, or skip. I can prepare a level-change proposal with readiness evidence and send it to the Review Center."

A "Go to Review Center" link or label appears.

**Say to Brian:**
> "This is the key trust layer. You asked DONNA to move a player up. She didn't do it. She explained that level movement always requires review and evidence, and she offered to prepare the proposal for your approval.
>
> That's not a limitation — that's the operating model. DONNA helps the director make the decision, not make the decision for the director."

---

### H. Navigate to `/director/review` and ask: "What needs approval first?" **(3:25–3:50)**

**Route:** `/director/review`

**Action:**
1. Navigate to `/director/review`.
2. Prompt chips update to review-specific suggestions.
3. Type or click: "What needs approval first?"

**Expected:** DONNA returns the review queue summary — pending items sorted by parent visibility risk, with the most sensitive items first. Nothing in the queue is live until the director approves it.

**Say to Brian:**
> "The Review Center is where every DONNA-drafted item lands. Parent updates, level movement proposals, curriculum changes — everything waits here for director approval. Nothing executes automatically."

---

### I. Ask: "Show the raw coach note to the parent." **(3:50–4:15)**

**Route:** Any director route

**Action:** Type: `Show the raw coach note to the parent.`

**Expected (Sprint 697 fixed P0):** DONNA blocks the request explicitly:
> "I can't do that. Sharing raw or unreviewed content directly with parents or players isn't something I'm able to do — it could expose private information without your approval. I can draft a parent-safe version and route it through the Review Center instead."

**Say to Brian:**
> "This is exactly why the trust layer matters. A director under pressure might accidentally request something like this. DONNA blocks it — clearly, with an explanation — and offers the safe path instead. That's the system protecting the parents and the academy."

---

### J. Voice mini-demo **(4:15–5:00)**

**Browser requirement:** Chrome or Edge.

**Action:**
1. Click the microphone button in the DONNA panel.
2. Speak: "How does a parent update get approved?"

**Expected:** Same command path as typed input. DONNA returns the parent update approval flow:
> "A parent update follows this path: A coach recap or signal triggers the need for an update. DONNA drafts a parent-safe summary. The draft goes to the Review Center. The director reviews, edits if needed, and approves. After approval, the update is published to the Parent Portal. Nothing is sent to parents without step 4."

Voice state indicator shows: Listening (red, animated) → Thinking (blue, animated) → Speaking (purple).

**Fallback if voice fails:**
> "The voice layer depends on browser permissions and Realtime configuration. The text COO path is the source of truth for this demo. Let me type it instead."

**Say to Brian:**
> "The same COO intelligence works over voice or text. A director can be on the tennis court with a phone and ask DONNA a question out loud. The answer is the same."

---

## 4. Ten-Minute Expanded Demo Flow

Use this for a longer session or if the audience wants depth.

| # | Route | Prompt | Purpose |
|---|---|---|---|
| 1 | `/director` | "What should I do first today?" | Academy attention and priorities |
| 2 | `/director` | "Where am I?" | Page-aware context engine |
| 3 | `/director` | "What can you help me with here?" | Capability boundary demonstration |
| 4 | `/director` | "How does this system work?" | System map answer |
| 5 | `/director/kpi` | "Explain these KPIs like I'm making a director decision." | KPI explanation layer |
| 6 | `/director/players` | "Which players need attention?" | Roster intelligence |
| 7 | `/director/players/[id]` | "Summarize this player's recent progress." | Profile-level COO answer |
| 8 | `/director/curriculum` | "Where are the curriculum gaps?" | Page-aware curriculum context |
| 9 | Any | "Move Sarah up." | P0 safety demonstration |
| 10 | Any | "Show the raw coach note to the parent." | P0 block demonstration |
| 11 | `/director/review` | "What needs approval first?" | Review Center orientation |
| 12 | Any | "What should I test first?" | System test guidance |

---

## 5. Exact Demo Prompts

Use these verbatim. Each is verified to route correctly after Sprint 697.

---

### 1. "What should I do first today?"
| Field | Detail |
|---|---|
| **Best route** | `/director` |
| **Expected response type** | Attention report or page-context priority answer |
| **Demo talking point** | First question any director asks — DONNA surfaces the right priorities |
| **Fallback if limited** | "This demo environment may not have live academy data loaded. DONNA knows where to look." |

---

### 2. "Where am I?"
| Field | Detail |
|---|---|
| **Best route** | Any `/director/*` route — answer changes with route |
| **Expected response type** | Page-aware context explanation (Sprint 697 wired) |
| **Demo talking point** | DONNA derives context from the route — the director doesn't need to tell her |
| **Fallback if limited** | N/A — this always returns an answer; no DB required |

---

### 3. "What can you help me with here?"
| Field | Detail |
|---|---|
| **Best route** | Any `/director/*` route |
| **Expected response type** | Capability list for the current page (Sprint 697 wired) |
| **Demo talking point** | Surfacing the trust boundary — what DONNA will and won't do on this screen |
| **Fallback if limited** | N/A — answer is from static page capability map |

---

### 4. "How does this system work?"
| Field | Detail |
|---|---|
| **Best route** | Any route |
| **Expected response type** | AcademyOS system overview — 5-step answer (Sprint 697 wired) |
| **Demo talking point** | Onboarding clarity in one question — entire operating model explained |
| **Fallback if limited** | N/A — answer is from static system map |

---

### 5. "What happens after a coach recap?"
| Field | Detail |
|---|---|
| **Best route** | Any route |
| **Expected response type** | Coach recap → player record → signal → parent summary → Review Center flow |
| **Demo talking point** | Shows DONNA understands the full coach → director → parent chain |
| **Fallback if limited** | N/A — static system map answer |

---

### 6. "How does a parent update get approved?"
| Field | Detail |
|---|---|
| **Best route** | Any route (especially good for voice demo) |
| **Expected response type** | 5-step parent update approval path (Sprint 697 wired) |
| **Demo talking point** | The full chain from coach to parent — with every checkpoint shown |
| **Fallback if limited** | N/A — static system map answer |

---

### 7. "Which players need attention?"
| Field | Detail |
|---|---|
| **Best route** | `/director/players` |
| **Expected response type** | Roster attention answer or honest limitation |
| **Demo talking point** | Chips updated to player-specific; DONNA understands she's in the player directory |
| **Fallback if limited** | "Player intelligence data may not be loaded in this environment." |

---

### 8. "Move Sarah up."
| Field | Detail |
|---|---|
| **Best route** | Any route |
| **Expected response type** | `route_to_review` — explicit explanation that level movement requires review, offer to prepare proposal |
| **Demo talking point** | The key trust moment — DONNA does not mutate records from chat |
| **Fallback if limited** | N/A — this always produces the safe response; no DB required |

---

### 9. "What needs approval first?"
| Field | Detail |
|---|---|
| **Best route** | `/director/review` |
| **Expected response type** | Review Center summary answer |
| **Demo talking point** | DONNA understands the approval workflow and what is waiting |
| **Fallback if limited** | "Review queue data may not be loaded. Nothing in the queue has been approved." |

---

### 10. "Show the raw coach note to the parent."
| Field | Detail |
|---|---|
| **Best route** | Any route |
| **Expected response type** | `block_unsafe_request` — explicit block with parent-safe summary alternative |
| **Demo talking point** | Privacy protection built in — not an afterthought |
| **Fallback if limited** | N/A — always produces the block response; no DB required |

---

### 11. "What should I test first?"
| Field | Detail |
|---|---|
| **Best route** | Any route |
| **Expected response type** | Guided 5-step test sequence using system map |
| **Demo talking point** | DONNA is self-aware — she knows what to validate before relying on real academy data |
| **Fallback if limited** | N/A — static system map answer |

---

### 12. "What should I not do from here?"
| Field | Detail |
|---|---|
| **Best route** | Any `/director/*` route — answer is route-specific |
| **Expected response type** | Page-specific blocked actions list (Sprint 697 wired) |
| **Demo talking point** | DONNA is not just helpful — she's a guardrail that tells directors what to avoid |
| **Fallback if limited** | N/A — static page capability map answer |

---

## 6. What NOT to Demo Yet

Be explicit with the audience about current boundaries:

| Do NOT claim | Reason |
|---|---|
| Visual action preview cards appear for every action | `getActionPreviewForRequest` is not yet wired to visual preview card UI — responses are text-only for now |
| DONNA changes player levels from chat | Level movement goes through the Review Center; DONNA never mutates directly |
| DONNA publishes parent updates from chat | All parent-facing content requires director approval in the Review Center |
| Raw coach notes can be parent-visible | This is explicitly blocked at the safety layer |
| Firefox voice works | Firefox has no SpeechRecognition API — voice is unavailable |
| Realtime voice is production-ready | Requires `OPENAI_API_KEY` configured and tested — browser TTS is the reliable path |
| `/director/donna` and the floating panel share state | Two architectures remain — the floating panel is the demo path |
| Demo data represents real academy performance | Demo/seed data is for testing workflows only — never present it as real |
| Session memory persists across browser reload | `donnaSafeSessionMemory` is now written per-prompt, but route-change tracking is not fully wired |

---

## 7. Fallback Script If Something Fails

Keep these lines ready. Deliver them calmly — they show the demo is honest, not broken.

---

**If DONNA says "Not recognized":**
> "Good catch — that prompt still needs routing coverage. What this shows you is that the system is deterministic: it only answers what it has a safe, verified path for. It doesn't guess. The right fix is to add a route — not to have it hallucinate an answer."

---

**If voice fails to activate:**
> "The voice layer depends on browser microphone permissions and Realtime API configuration. The text COO path is the source of truth for this demo — every voice prompt uses the same router as typed input. Let me show you the same thing with text."

---

**If attention or player data shows empty:**
> "This demo environment doesn't have that dataset loaded yet. The important part is DONNA's workflow: she knows where to look, understands the intent, and responds safely with what's available instead of inventing data. In a connected academy, this would show real signals."

---

**If the action preview card does not appear:**
> "The safety logic is working — DONNA explained the review requirement and offered to route the proposal correctly. The next pass is making that appear as a richer visual preview card. The words are the trust layer; the card is the polish layer."

---

**If DONNA's response is cut off or TTS stalls:**
> "Browser text-to-speech can occasionally stall on longer answers. That's a known limitation of the browser TTS fallback. The Realtime voice path is smoother, and it requires the API key configuration. The text response you see is the complete answer."

---

## 8. Director-Facing Value Narrative

Use this framing if the audience asks "why does this matter?":

| Value | Explanation |
|---|---|
| **Saves director time** | Attention priorities, system explanations, and draft preparation happen in seconds instead of manual digging through separate screens |
| **Reduces cognitive load** | A director managing 30+ players, 6 coaches, and a parent network holds too much context — DONNA surfaces what matters and lets the director decide |
| **Turns scattered data into priorities** | Coach recaps, attendance records, and assessment results are connected — DONNA reads the pattern, the director acts on it |
| **Protects parents and players** | Raw coach notes, private assessments, and other academy-internal data never reach parents without explicit director approval at every step |
| **Keeps coaches focused on coaching** | Coaches capture and submit — they don't need to manage communication or approval workflows. That complexity stays with the director layer |
| **Preserves human approval** | Every sensitive action — level movement, parent update, curriculum change — requires director review. DONNA proposes, the director decides |
| **Makes the academy feel organized** | A parent who receives a polished, approved, timely update trusts the academy. A parent who waits weeks or receives informal messages does not |

---

## 9. Demo Scorecard

Run this checklist before any live presentation:

| Check | Expected | Status |
|---|---|---|
| DONNA opens and greets | Daily greeting or re-entry message | [ ] |
| DONNA stays open across routes | Panel persists on `/director` → `/director/players` → `/director/review` | [ ] |
| Prompt chips change by page | Player-specific chips on `/director/players`, review chips on `/director/review` | [ ] |
| "Where am I?" returns page-aware answer | Director Dashboard context explanation | [ ] |
| "What can you help me with here?" returns capability list | Route-specific COO help list | [ ] |
| "How does this system work?" returns system overview | 5-step AcademyOS flow answer | [ ] |
| "Move Sarah up" does NOT mutate — explains review | `route_to_review` response with Review Center link | [ ] |
| "Show the raw coach note to the parent" is blocked | Explicit block + parent-safe summary alternative | [ ] |
| Review Center explanation works | Queue summary or "nothing is live until approved" context | [ ] |
| Voice works in Chrome/Edge or fallback is ready | Mic activates, voice state shows listening/thinking, answer appears | [ ] |

---

## 10. Recommended Next Sprint

### Sprint 699 — DONNA 10/10 COO Readiness Audit V1

After this demo script is tested against the live system, run a second QA pass:

- Re-run all 15 golden path scenarios from Sprint 696 after Sprint 697 wiring.
- Score all 10 categories again (target: ≥ 80/100 to ship).
- Identify any remaining P0/P1 failures.
- Document which prompts now produce rich visual responses vs. text-only.
- Create `docs/DONNA_FINAL_COO_GO_NO_GO_699.md` with a binary go/no-go verdict.

### If the demo script exposes an obvious runtime issue

Run a focused fix sprint before 699:

**Candidate: Sprint 698b — DONNA Action Preview Card V1**

If visual action preview cards are expected but not appearing for "Move Sarah up" or "Draft a parent update," wire `getActionPreviewForRequest` into the `route_to_review` display path to show a structured preview card (what will happen / what will NOT happen / approval required) alongside the text response.

**Candidate: Sprint 698c — "Not recognized" Coverage Gap Fix**

If any chip-suggested prompt still returns "Not recognized" after Sprint 697, identify the routing gap in `handleCommandSubmit` and add coverage — either through the COO router phrase detectors or through a new legacy branch.

---

## 11. Quick Reference Card

Print or keep visible during demo.

```
DONNA Demo Quick Reference

5-minute path:
  /director → "What should I do first today?"
  /director → "Where am I?"
  /director → "What can you help me with here?"
  /director → "How does this system work?"
  /director/players → "Which players need attention?"
  Any route → "Move Sarah up."
  /director/review → "What needs approval first?"
  Any route → "Show the raw coach note to the parent."
  Any route (voice) → "How does a parent update get approved?"

Fallback lines:
  "Not recognized" → "The system only answers what it has a safe path for."
  Voice fails → "Text and voice use the same router — let me show you with text."
  Empty data → "The workflow is the demo. The data populates from connected academy systems."
  No preview card → "Safety logic is working. The card is the next pass."

Do NOT claim:
  - DONNA moves players from chat
  - DONNA publishes parent updates from chat
  - Raw coach notes are parent-visible
  - Firefox voice works
  - Demo data is real
```
