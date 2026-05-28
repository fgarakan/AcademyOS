# DONNA Brian Demo Script
**Sprint:** 913.7
**Date:** 2026-05-28
**Audience:** Brian Dabul — Dabul Tennis Academy director

---

## 1. Setup

### Before the demo

| Step | Action |
|---|---|
| Browser | Use Chrome (best Web Speech API support) |
| Route | Open `/director/donna` directly — NOT the floating button in the corner |
| Demo academy | Dabul Tennis Academy with live director login |
| Sidebar | Confirm "DONNA / Academy assistant" is visible at item #2 |
| Voice | Test microphone access and TTS audio before Brian arrives |
| Pre-check | Ask "Give me my director brief" once to confirm `isLive = true` (no `[Demo]` prefix) |

### Required demo data (minimum)

Run these SQL checks before the demo:

```sql
-- 1. Confirm active players exist
SELECT count(*) FROM players WHERE academy_id = '<academy_id>' AND status = 'active';
-- Want: ≥ 3

-- 2. Confirm coaches exist
SELECT count(*) FROM academy_memberships WHERE academy_id = '<academy_id>' AND role IN ('coach','head_coach') AND is_active = true;
-- Want: ≥ 1

-- 3. Confirm curriculum levels exist
SELECT id, display_name FROM curriculum_levels ORDER BY sort_order;
-- Want: 15 rows (Red 1–3, Orange 1–3, Green 1–3, Yellow 1–3, HP 1–3)

-- 4. Check review queue
SELECT count(*), status FROM proposed_actions WHERE academy_id = '<academy_id>' GROUP BY status;
-- Ideal: some pending_review rows for a richer brief
```

### What not to click

- Do NOT click the floating `⚡` button in the lower-right corner — that uses the legacy DONNA panel
- Do NOT navigate to `/director` main page during the curriculum draft demo — it would navigate away from the builder
- Do NOT click "Approve" in the Curriculum Builder during the demo unless showing the full approval flow

### If data is thin

If `pendingReviews = 0` and `attentionItems = []`:
- Use page guide mode as the entry point
- Go straight to the curriculum draft creation loop
- Mention: "With real academy data, DONNA would also surface who needs attention and what's waiting for your review."

---

## 2. Golden Demo Path

### Step 1 — Open DONNA

**Action:** Click "DONNA / Academy assistant" in the sidebar (item #2)

**Brian sees:** The DONNA Hub page with:
- Academy Pulse card (health score)
- Attention items (if data exists)
- DONNA chat panel on the right

**Say:** "This is DONNA — the academy's operating assistant. She can see what's happening in your academy, recommend what matters most, and help you draft curriculum changes. She never takes action without your approval."

---

### Step 2 — Page guide

**Type or say:** "What should I do here?"

**DONNA responds:** "On the DONNA Hub: Interact with DONNA directly... A good place to start: ask me 'What can you help me with?'"

**Say:** "See how DONNA knows exactly what page she's on and what she can do from here? Every page has its own guidance."

---

### Step 3 — Director brief

**Type or say:** "Give me my director brief."

**DONNA responds:** Ranked list of academy priorities (or "Academy looks clear" if data is minimal)

**Say:** "DONNA ranks everything by urgency — missing coaching data first because it's time-sensitive, then player risks, then review queue items. She uses live data from your academy, and she always tells you why each item matters."

If `[Demo]` prefix appears: "In a live session with more data, this would show your real academy signals."

If `oldestPendingReviewAgeDays >= 7`: Point out the staleness warning. "Notice DONNA flags when items have been waiting too long — that's a coaching bottleneck."

If a cross-signal correlation appears: "And here's DONNA connecting the dots — she noticed the same player appears in both a stall signal and a risk flag. That's not just two separate problems; it's a compound situation that needs director attention."

---

### Step 4 — What should I do first?

**Type or say:** "What should I do first?"

**DONNA responds:** Structured 5-section priority response

**Say:** "This is the COO format — Top priority, Why it matters, Evidence, Best next action, and what DONNA will not do automatically. Every single answer ends with what stays in your hands."

---

### Step 5 — Review queue

**Type or say:** "What needs review?"

**DONNA responds:** Review queue breakdown (or empty with curriculum draft count)

**Say:** "DONNA tells you what's in your review queue and what type — attendance exceptions, evidence drafts, curriculum changes. She also tracks how old items are. But she will never approve, reject, or apply anything. That's always you."

---

### Step 6 — Navigate to Curriculum Builder

**Action:** Click "Curriculum" in the sidebar, or use the "Ask DONNA" chip at the top of the Curriculum Builder page

*(If using the DONNA hub, just continue in the chat)*

---

### Step 7 — Create a curriculum draft

**Type or say:** "Add a drill for Orange 2 focused on forehand preparation."

**DONNA responds:** "I can create a draft to add a forehand preparation drill to your Orange 2 curriculum. It will go to your Review Center for approval — nothing in the official curriculum changes until you approve it. Should I create this draft?"

**Say:** "DONNA proposed the draft and asked for confirmation before doing anything. This is the key safety principle — she proposes, you approve."

**Type or say:** "Yes."

**DONNA responds:** `"forehand preparation" drill draft created for Orange 2. Nothing in the curriculum changes until you approve it.`

*(If pendingDraftCount > 1, she shows the count: "You now have N curriculum drafts waiting.")*

**Say:** "Done. The draft is in the Curriculum Builder queue — not in the official curriculum yet. Only after you review and approve it there does it become real."

---

### Step 8 — Same for another level

**Type or say:** "Same for Green 2."

**DONNA responds:** "I can create a draft to add a forehand preparation drill to your Green 2 curriculum. Should I create this draft?"

**Say:** "Notice DONNA remembered the context from the previous request — same drill, same focus area, just a different level. She handles the continuity."

**Type or say:** "Yes."

---

### Step 9 — Safety check

**Type or say:** "What should I be careful with?"

**DONNA responds:** "On the [current page], I must not and will not: [blocked actions list]. If you ask me to do any of these, I'll explain why and offer a safe alternative."

**Say:** "DONNA is always explicit about what she won't do. This isn't a black box — every boundary is stated and enforced in the code."

---

### Step 10 — Closing

**Say:**

"So to summarize DONNA:
- She's an academy operating assistant, not a chatbot
- She ranks what matters most, explains why with evidence, and recommends actions
- She connects signals — not just listing problems, but noticing when a player is both stalled and at risk
- She drafts curriculum changes and routes them through your approval process
- She never approves, applies, or communicates to parents automatically
- Everything stays in your hands"

---

## 3. Talk Track Phrases

| Moment | What to say |
|---|---|
| DONNA hub opens | "This is the DONNA command center — live data about your academy, organized by urgency." |
| Director brief appears | "These are ranked by urgency, not alphabetically. Missing coach data is always first because it's time-sensitive." |
| Evidence line shows | "She's not guessing — she's using real data from your system. That evidence tells you exactly what she based this on." |
| Confirmation prompt | "She always asks before creating anything. Propose, confirm, then review in the queue." |
| Safety note | "And she always ends with what she won't do automatically. That boundary is built into every answer." |
| Cross-signal | "Here she's connecting two separate signals — a stall and a risk flag — for the same player. That's intelligence, not just a list." |

---

## 4. Demo Fallbacks

| Problem | Recovery |
|---|---|
| Voice recognition fails | Switch to typed input — "DONNA works just as well by typing" |
| Live data is thin / all clear | Use curriculum draft loop as primary — "With real data, this would show who needs attention" |
| TTS not playing | "The audio is muted for demo — she'd be speaking this aloud in the field" |
| Review queue is empty | Create a test draft first, then ask "What needs review?" — shows curriculum draft count |
| Correlations don't appear | "Correlations need matching data across signals — in a live academy with real patterns, she'd connect these automatically. Let me show you a ranked priority instead." |
| Page loads slowly | Navigate to `/director/donna` directly from the URL bar — avoids any nav loading |
| Confirmation times out | "If I wait too long, she forgets the pending action — I can just ask again." |

---

## 5. Demo Data Seed (if needed)

If the demo academy has minimal data, run these SQL statements to create safe demo context. Only run in a non-production demo environment:

```sql
-- Verify these are the right IDs before running
-- DO NOT run in production

-- Optional: create a pending proposed_action for demo
-- (Only if the review queue is empty and you want to show queue intelligence)
-- INSERT INTO proposed_actions (...) VALUES (...) -- consult DB schema
```

**Better alternative:** Create a curriculum draft via DONNA in the demo itself (Step 7–8 above). This populates the curriculum override queue live and shows the full confirmation flow at the same time.

---

## 6. Post-Demo Verification

After the demo, verify:

```sql
-- Confirm all created items are pending_review only
SELECT id, status, proposed_change->>'title' as title, created_at
FROM academy_curriculum_overrides
WHERE academy_id = '<academy_id>'
ORDER BY created_at DESC
LIMIT 10;
-- Expected: all rows with status = 'pending_review'

-- Confirm no live curriculum was modified
SELECT count(*) FROM curriculum_content_items
WHERE academy_id = '<academy_id>'
AND updated_at > now() - interval '1 hour';
-- Expected: 0 (no official curriculum changes during demo)
```
