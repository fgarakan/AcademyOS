# Internal Pilot DONNA Guided Workflow QA V1
**Date:** 2026-05-29
**Sprint:** 947
**Status:** Complete

---

## Pilot Participants

- **Director:** Brian Dabul (Dabul Tennis Academy)
- **Coach:** Farshad (Coach Farshad, internal pilot)

---

## Guided Workflow — Director (Brian)

### Step 1 — Morning Brief
1. Brian opens `/director/donna`
2. Brian says or types: **"Give me a brief"** or **"What's going on today?"**
3. DONNA responds with:
   - Academy health signal (critical/attention_needed/on_track)
   - Top 3 priorities with explanations
   - Highlight glow on top priority element (if on a page with a registered target)
   - Navigation offer to first priority
4. Brian says **"yes"** → navigates to Review Center

**Expected behavior:**
- If `pendingReviews > 0`: Priority 1 = pending review count, highlighted with teal glow
- If `attendanceExceptions > 0`: Included as Priority 2
- Brief confirms nothing takes effect without Brian's decision

**Data needed for live test:**
- At least 1 proposed_action with `status = 'pending_review'` in the academy
- Recommend: have Coach Farshad complete a wrap-up first (see coach workflow below)

---

### Step 2 — "What Should I Do Next?"
1. Brian navigates to `/director/review`
2. Brian asks: **"What should I do next?"**
3. DONNA responds:
   - Live pending count from `directorCtx.pendingReviews`
   - Highlights `pending-review-list` with teal glow
   - Text: "You have N items waiting for your decision here. I'm highlighting the review list now…"
4. Brian sees teal glow on the pending items list

**Expected behavior:** Full live-data answer + same-page highlight

---

### Step 3 — Director Reviews Wrap-Up
1. Brian clicks a coach wrap-up in the Review Center
2. Brian reviews the session summary (Q1–Q6 answers)
3. Brian makes a decision:
   - **Approve**: clicks "Approve" → status = `approved`
   - **Reject**: clicks "Reject" with note → status = `rejected`
   - **Ask for clarification**: clicks "Clarification Needed" → status = `clarification_needed`
4. Sprint 904 approve/reject paths execute

**Expected behavior:** Sprint 904 behavior preserved exactly. DONNA does not participate in the approval click — that is always Brian's action.

---

### Step 4 — Apply Wrap-Up
1. After approving, Brian clicks "Apply" (separate from approve)
2. `applyWrapUpDraftAction` writes to `sessions.session_notes`
3. Session status moves to `completed`
4. `audit_logs` entry created
5. `proposed_action.status` = `executed`

**Expected behavior:** All Sprints 926–936 behavior preserved.

---

### Step 5 — DONNA Explains Next Step
1. Brian is back on `/director/review`
2. Brian asks: **"What should I do next?"**
3. DONNA: checks `pendingReviews` — now lower (or 0 if Brian cleared the queue)
4. If reviews remain: points to next item
5. If cleared: "Your Review Center is clear. Well done. This is a good time to check player development trajectories."

---

## Guided Workflow — Coach (Farshad)

### Step 1 — Start Session
1. Farshad opens `/coach`
2. DONNA (floating panel or `/coach/donna`): "What sessions do I have today?"
3. DONNA shows today's sessions (via CoachDonnaContext)
4. Farshad taps a session → `/coach/sessions/[sessionId]`

**DONNA highlight:** `coach-today-sessions` should glow if Farshad asks "What should I do next?" on `/coach`

---

### Step 2 — During Session
1. Farshad opens session page
2. DONNA (if asked "What should I do next?"): points to `coach-run-session` section
3. Farshad marks attendance, delivers blocks

---

### Step 3 — Submit Wrap-Up
1. After session, Farshad taps "Wrap-Up" CTA → `/coach/sessions/[sessionId]/wrap-up`
2. DONNA (Shell C — DonnaVoiceWrapUpShell) guides through 6 questions
3. Farshad submits → `proposed_actions` row created with `status = 'pending_review'`
4. Review Center badge on Brian's director sidebar increments

**Expected behavior:** Full Sprints 926–936 wrap-up loop

---

### Step 4 — Coach Sees Director Feedback
1. Farshad navigates to `/coach/sessions/[sessionId]/wrap-up/review`
2. Coach wrap-up review page shows:
   - Submission status
   - Director decision (approved/rejected/clarification_needed)
   - Director note (if any)
3. If `clarification_needed`: Farshad can see what Brian needs

---

## Data Seeding Requirements

For a complete pilot run, the academy needs:
1. At least 1 active coach with sessions scheduled
2. At least 1 active player in each session
3. At least 1 completed coach wrap-up in `proposed_actions` (status = `pending_review`)
4. Demo academy ID: `00000000-0000-0000-0000-000000000001` (if using demo data)

**DONNA does not generate fake data.** All data must come from real wrap-up submissions or seeded demo data.

---

## Pilot Readiness Rating

| Area | Rating | Notes |
|---|---|---|
| Director "what next?" | 9/10 | Live-data + highlight working |
| Director morning brief | 9/10 | Top 3 priorities + highlight |
| Review queue guidance | 9/10 | Counts from live directorCtx |
| Approve/reject flow | 10/10 | Sprint 904 — certified |
| Coach wrap-up loop | 9/10 | Sprint 936 — certified at 8/10 |
| Coach highlight | 8/10 | Banner mounted; session elements registered |
| Parent portal | 6/10 | Chip-based; no routing engine |
| Player portal | 6/10 | Chip-based; no routing engine |
| **Overall pilot readiness** | **8.5/10** | |

---

## Known Setup Gaps Before Live Pilot

1. `OPENAI_API_KEY` must be set in `.env.local` for voice transcription (documented in KNOWN_LIMITATIONS.md)
2. Guardian-to-player linkage must be set for parent portal to show live data
3. `profile_id` must be set on player records for player portal to show live data
4. Pending migrations (044–062) must be applied to live Supabase instance

---

## Go / No-Go for Brian Pilot

**GO:** Brian can use the director workflow (brief → review queue → approve/reject → apply) with live DONNA guidance, highlight, and navigation.

**NO-GO items:**
- Voice transcription (needs OPENAI_API_KEY)
- Parent/player portal live data (needs guardian/profile linkage)
- Pending DB migrations for full schema completeness
