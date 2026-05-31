# Brian Pilot Demo Script + Seed Data — Sprint 1056

**Sprint:** 1056 — Brian Pilot Demo Script + Seed Data V1
**Date:** 2026-05-31
**Pilot:** Brian Dabul — Dabul Tennis Academy
**Duration:** 30–45 minutes

---

## Pre-demo setup

### Seed data
- Demo seed file: `supabase/seeds/brian_dabul_demo_seed.sql`
- Full guide: `docs/BRIAN_DABUL_DEMO_SEED_EXECUTION_PACKET.md`
- Replace placeholder UUIDs with real auth.users UUIDs before running
- Academy ID: `00000000-0000-0000-0001-000000000001` (Monteiro Tennis Academy demo)

### Environment check
- [ ] `OPENAI_API_KEY` set (DONNA God Mode responses)
- [ ] Supabase connected
- [ ] Demo seed applied
- [ ] Browser: Chrome or Edge (not Firefox, not Safari for voice)
- [ ] Microphone permission: pre-grant before demo to avoid mid-demo prompt
- [ ] Screen: 1280px+ width recommended (panel + sidebar visible)

---

## Demo script

### Opening (2 min)

**Say:** "This is AcademyOS — a director-led operating system for tennis academies. The idea is simple: instead of using spreadsheets and group chats, you run your academy from one place. DONNA, the AI assistant, helps you surface what needs attention without you having to go looking for it."

**Show:** The login screen or the director dashboard.

---

### Scene 1: Director Dashboard (5 min)

**Navigate to:** `/director`

**Say:** "When you log in as a director, this is your command center. The hero card tells you what needs your attention right now — how many things are in your review queue, what's pending."

**Show:** DirectorPrimaryActionHero card. KPI grid.

**Click DONNA button (bottom right)**

**Say:** "DONNA opens as a sidebar. If you have mic permission, she starts listening immediately. You can ask anything."

**Speak (or type):** "What needs my attention today?"

**Show:** DONNA response in the thread. If God Mode is active, the LLM response card.

**Say:** "DONNA doesn't just give a generic answer — she looks at your actual academy data and tells you specifically what to focus on."

---

### Scene 2: Review Queue (5 min)

**Navigate to:** `/director/review`

**Say:** "Everything that coaches submit — session recaps, attendance exceptions, observations — goes through your review queue. Nothing is applied until you approve it. That's the core safety guarantee."

**Show:** Tabs (Wrap-ups, Attendance, Observations, etc.)

**Open a pending item.**

**Say:** "You see exactly what the coach reported. You can approve, reject, or ask for clarification. When you approve, it goes into the player record. When you reject, the coach gets feedback."

**Approve an item.**

---

### Scene 3: Player Directory + Profile (8 min)

**Navigate to:** `/director/players`

**Say:** "Your player directory. Every player in the academy. You can filter by status, curriculum level, group."

**Show:** Player list with status badges. If any advancement-ready players, show the lime banner.

**Click a player.**

**Say:** "The player profile is the core of the system. You see their curriculum level, development summary, priorities, and all observations. This is the single source of truth for each player."

**Show:** Header (level badge or orange warning if no level). Overview tab: command center card.

**If no curriculum level:** "This player doesn't have a curriculum level set yet — that's the orange warning. Let me assign one."

**Navigate to Skill Path tab.**

**Assign curriculum level if not set.**

---

### Scene 4: Class Templates + Session Creation (5 min)

**Navigate to:** `/director/class-templates`

**Say:** "Class templates are your reusable session blueprints. You design them once — define the block structure, connect curriculum goals — and coaches run them on court."

**Open a template.**

**Show:** 5-step builder stepper. Readiness indicator.

**Navigate to:** `/director/sessions`

**Click "New Session".**

**Say:** "Creating a session is simple. Choose the template, set the date, assign the coach. Done. The coach gets a structured plan to follow."

**Create a session.**

---

### Scene 5: Coach Experience (5 min)

**Log in as coach (or demonstrate with director screen sharing)**

**Navigate to:** `/coach`

**Say:** "From the coach's perspective, everything is focused on today's sessions. No navigation complexity. Just: what do I run, how do I run it, and what do I report after."

**Show:** Today's sessions. Session detail (blocks, roster, attendance).

**Navigate to wrap-up.**

**Say:** "After each session, coaches answer 6 quick questions. No forms, no admin overhead. DONNA helps with voice input if they prefer to speak their notes."

---

### Scene 6: DONNA Voice Loop (3 min)

**Return to director view. Open DONNA panel.**

**Say:** "Let me show the voice loop. I click once, DONNA opens and starts listening immediately."

**Speak:** "Show me players who need attention."

**Show:** DONNA highlight chip or response.

**Say:** "DONNA can also point you directly to a specific section of the page."

**Click a highlight chip if available.**

**Say:** "The teal glow shows exactly what DONNA is referencing. No ambiguity."

---

### Closing (2 min)

**Say:** "The philosophy is: simple by default, detailed by exception. Every page has one obvious next action. DONNA surfaces what matters. Coaches report what happened. You make the decisions. The system records everything."

**Key points to emphasize:**
1. Nothing happens automatically — every action goes through your approval
2. Parent and player data is never exposed without your control
3. DONNA proposes, you decide
4. All voice input is reviewed before saving

---

## Frequently asked questions

**"Does DONNA have access to player notes directly?"**
No. DONNA sees academy-level signals (counts, statuses) but never reads raw coach notes or player observations. All data shown is aggregated.

**"Can coaches communicate with parents directly?"**
No. All parent communications are drafted and held for director review. Nothing is sent automatically.

**"What happens if DONNA makes a mistake?"**
DONNA proposes — directors approve. Nothing is applied without a human decision. The review queue is the safety layer.

**"Is voice data stored?"**
No. Voice transcripts stay in browser memory during the session and are never uploaded or stored.
