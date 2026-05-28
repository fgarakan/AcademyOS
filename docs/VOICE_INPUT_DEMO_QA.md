# Voice Input Demo Layer — QA Checklist

**Sprint:** 125
**Date:** 2026-05-01

---

## How to run these tests

1. Run `npm run dev`
2. Log in as the academy director
3. Navigate to the relevant routes
4. Work through each test case manually

---

## Test 1 — Browser supports voice

**Route:** `/director/curriculum`

**Steps:**
1. Open the Curriculum Customization panel
2. Confirm the "Start speaking" button is visible
3. Click "Start speaking"
4. Speak a phrase
5. Confirm transcript appears in the text box

**Expected:**
- Microphone button visible
- "Listening…" indicator appears on click
- Transcript populates text box
- Text box is editable after stopping

**Pass criteria:** Voice button visible, transcript appears

---

## Test 2 — Browser does not support voice

**Route:** `/director/curriculum` or `/director/sessions/[sessionId]`

**Steps:**
1. Open in Firefox (or a browser without SpeechRecognition)
2. Open the Curriculum Customization panel or Coach Recap section

**Expected:**
- "Voice input is not available in this browser. You can still type." shown inline
- Voice button not shown
- Textarea works normally
- Submit flow unchanged

**Pass criteria:** Fallback message shown, textarea functional, no JS errors

---

## Test 3 — Microphone permission denied

**Route:** `/director/curriculum`

**Steps:**
1. Click "Start speaking"
2. Deny the microphone permission in browser prompt

**Expected:**
- Error message shown: "Microphone access was denied…"
- Message is calm, not alarming
- Textarea remains editable
- "Start speaking" can be clicked again after granting permission in browser settings

**Pass criteria:** Error shown inline, textarea still functional

---

## Test 4 — Transcript appears in editable text box

**Route:** `/director/curriculum`

**Steps:**
1. Click "Start speaking"
2. Speak: "For our Orange 2 players, I want more return-of-serve readiness before Orange 3"
3. Click "Stop listening"
4. Edit the transcript in the text box

**Expected:**
- Full transcript appears in text box
- Text box is editable after listening stops
- Edits are reflected in the text box

**Pass criteria:** Transcript editable, changes saved in state

---

## Test 5 — User can edit transcript before submit

**Route:** `/director/curriculum`

**Steps:**
1. Speak a phrase
2. Manually change words in the text box before submitting

**Expected:**
- Text box accepts edits
- Edited text (not original transcript) is submitted

**Pass criteria:** Edits persist, edited text submitted

---

## Test 6 — Voice does not auto-submit

**Route:** `/director/curriculum`

**Steps:**
1. Click "Start speaking"
2. Speak a phrase
3. Stop speaking (let recognition auto-end)
4. Confirm no draft was created automatically

**Expected:**
- Transcript appears in text box
- No draft is created until "Create Override Draft" is clicked
- No navigation or toast or DB write occurs automatically

**Pass criteria:** No auto-submission confirmed via DB check or absence of success toast

---

## Test 7 — Curriculum voice input creates draft only after manual submit

**Route:** `/director/curriculum`

**Steps:**
1. Speak or type a curriculum customization
2. Click "Create Override Draft"
3. Check Review Queue

**Expected:**
- Draft created only after button click
- Success message shown: "Draft created — check Review Queue"
- Draft appears in the Review Queue
- No automatic curriculum mutation

**Pass criteria:** Draft in Review Queue, no automatic change applied

---

## Test 8 — Coach recap voice input saves only after manual submit

**Route:** `/director/sessions/[sessionId]`

**Steps:**
1. Open any session
2. Scroll to COACH RECAP section
3. Speak or type a recap
4. Click "Save Recap"
5. Confirm recap appears in recap history

**Expected:**
- Recap saved only after "Save Recap" click
- Success message shown
- Recap appears in "Recent recaps" list after page refresh
- No player records modified automatically

**Pass criteria:** Recap in history, no auto-mutation

---

## Test 9 — No external API calls

**Method:** Open browser DevTools → Network tab → filter by XHR/Fetch

**Steps:**
1. Run any voice input session
2. Monitor network requests during and after speaking

**Expected:**
- No requests to openai.com, whisper, elevenlabs, or any external AI endpoint
- Only requests to the local Next.js server and Supabase

**Pass criteria:** Zero external AI API calls in network log

---

## Test 10 — No parent/player visibility

**Check:**
- `VoiceCoachRecapInput` is on `/director/sessions/[sessionId]` (director/coach route)
- `VoiceOverrideInputPanel` is on `/director/curriculum` (director route)
- Neither component is imported into `/player`, `/parent`, or `/coach` routes

**Pass criteria:** Voice components not accessible on parent/player routes

---

## Test 11 — No communication sent

**Steps:**
1. Submit a curriculum override draft
2. Submit a coach recap
3. Check that no email, push, SMS, or Slack message was sent

**Expected:** Zero communications triggered by either action

**Pass criteria:** No communication in any channel

---

## Test 12 — No global curriculum mutation

**Steps:**
1. Submit a curriculum override draft via voice
2. Check global `curriculum_levels` table for changes

**Expected:**
- Global curriculum unchanged
- Only `proposed_actions` row created with `status = 'pending_review'`
- Draft visible in Review Queue but not applied

**Pass criteria:** `curriculum_levels` table unchanged, proposed_actions row present

---

## Test 13 — No master template mutation

**Steps:**
1. Submit a coach recap via voice
2. Check `templates` and `session_blocks` tables

**Expected:**
- No template changes
- No session_blocks changes
- Only `voice_notes` row created with `processing_status = 'pending'`

**Pass criteria:** Templates table unchanged, voice_notes row created

---

## Test 14 — No player level movement

**Steps:**
1. Submit a coach recap mentioning a player name
2. Check `player_curriculum_states` table for changes

**Expected:**
- No player curriculum state changes
- No `player_priorities` changes
- Recap is raw text only until structuring and approval

**Pass criteria:** Player tables unchanged after recap save

---

## Summary of coverage

| # | Test | Status |
|---|---|---|
| 1 | Browser supports voice | Manual |
| 2 | Browser does not support voice | Manual (Firefox) |
| 3 | Microphone permission denied | Manual |
| 4 | Transcript editable | Manual |
| 5 | User edits before submit | Manual |
| 6 | No auto-submit | Manual |
| 7 | Curriculum draft manual only | Manual |
| 8 | Recap save manual only | Manual |
| 9 | No external API calls | DevTools network |
| 10 | No parent/player visibility | Code review |
| 11 | No communication sent | Manual + code review |
| 12 | No global curriculum mutation | DB check |
| 13 | No master template mutation | DB check |
| 14 | No player level movement | DB check |
