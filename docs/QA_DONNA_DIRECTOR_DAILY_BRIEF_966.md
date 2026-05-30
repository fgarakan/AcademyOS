# QA — Sprint 966 DONNA Director Daily Brief V1

**Sprint:** 966  
**Date:** 2026-05-30

---

## TypeScript

- [ ] `npx tsc --noEmit` passes with no errors in sprint files

---

## Brief chip presence

| Route | Expected chip(s) | Present? |
|---|---|---|
| `/director` | "Walk me through academy priorities", "What needs my attention?" | |
| `/director/review` | "Show daily brief" | |
| `/director/sessions` | "Show daily brief" | |
| `/director/players` | "Show daily brief" | |
| `/director/players/[id]` | No brief chips (existing PP chips only) | |
| `/director/curriculum` | No brief chips | |
| `/director/class-templates` | No brief chips | |
| `/coach/*` | No brief chips | |

---

## Brief chip behavior

- [ ] Clicking a brief chip on `/director` triggers `handleFetchDailyBrief()`
- [ ] Loading indicator appears while brief loads
- [ ] Brief card renders in `DonnaWorkflowCards` on success
- [ ] `speakDonna()` narrates brief summary on load
- [ ] Error state shows "Brief unavailable — check back later."
- [ ] Empty-state brief renders with zero sections (no crash)

---

## Voice behavior

- [ ] Brief chip click does not start a second voice widget
- [ ] One DONNA button only — no duplicate voice toggle
- [ ] Sprint 965 spoken greeting still works after sprint 966 changes
- [ ] `speakDonna` voice path unchanged

---

## Highlight escalation (Sprint 964 regression)

- [ ] Highlight chips on `/director/curriculum` still glow on click
- [ ] Second click on same highlight target shows warning pulse
- [ ] Brief chips do NOT trigger highlight escalation (no targetId)
- [ ] `DonnaHighlightBanner` untouched

---

## Approval gate (Sprint 904 regression)

- [ ] Approve button in review queue still works
- [ ] Reject button in review queue still works
- [ ] `proposed_actions` pipeline untouched
- [ ] `execute_approved_action()` untouched

---

## Safety checks

- [ ] No new mutation on brief chip click
- [ ] No parent/player data exposed by chips
- [ ] No level changes triggered
- [ ] No communications sent
- [ ] No new API route created
- [ ] No migration created
- [ ] No RLS change

---

## Architecture compliance

- [ ] Existing `/api/donna/brief` used (no new brief API)
- [ ] Existing `handleFetchDailyBrief` used (no new fetch function)
- [ ] Existing `DonnaWorkflowCards` / `DonnaDailyBriefCard` render the result
- [ ] Existing `speakDonna` handles TTS
- [ ] No new DONNA surface created
- [ ] No new voice path created
- [ ] `docs/architecture/DONNA_DIRECTOR_DAILY_BRIEF_966.md` accurately describes the implementation

---

## Files changed (only these)

- `src/lib/donna/donnaPageChipRegistry.ts`
- `src/components/donna/DonnaPanelPageChips.tsx`
- `src/components/assistant/DonnaAssistantButton.tsx`
- `docs/architecture/DONNA_DIRECTOR_DAILY_BRIEF_966.md`
- `docs/QA_DONNA_DIRECTOR_DAILY_BRIEF_966.md`
- `docs/CHANGELOG.md`
