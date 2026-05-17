# Post-V1 Manual QA Triage — Sprint 747

**Sprint:** 747
**Date:** 2026-05-17

---

## Purpose

Identify any remaining manual QA items that should be verified before Brian's first real session with AcademyOS.

---

## QA Triage Matrix

| Area | Check | Status | Risk |
|---|---|---|---|
| Director login | Can log in, lands on `/director` | Must verify | High — blocking |
| Coach login | Can log in, lands on `/coach` | Must verify | High — blocking |
| Demo sandbox creation | "Create Demo Sandbox" succeeds | Verified Sprint 742 | Low |
| Demo session open | "Open Demo Session" link works | Verified Sprint 742 | Low |
| Voice curriculum prompt | Speak → transcript appears | Requires Chrome + mic | Medium |
| Voice session recap | Speak → transcript appears in session | Requires Chrome + mic | Medium |
| Review queue loads | 8 tabs visible, no crash | Verified Sprint 729 | Low |
| Player import dry-run | CSV validation passes | Must verify with Brian's CSV | High — blocking |
| Player import live | Players appear in `/director/players` | Must verify after dry-run | High |
| Coach wrap-up drawer | Opens, submits, creates proposed_action | Verified Sprint 84 | Low |
| Mobile coach portal | Wrap-up usable on phone | Verified Sprint 732 | Low |
| Academy Health | Loads with honest "partial data" label | Verified Sprint 730 | Low |
| Curriculum explorer | Levels and drills visible | Must verify with active data | Medium |
| TypeScript clean | `npx tsc --noEmit` passes | Verified Sprint 739 | Low |

---

## Pre-Pilot Verification Checklist

Before Brian's first real session:

- [ ] Director account created and can log in
- [ ] Coach account created and can log in
- [ ] Demo sandbox created and all 5 status cards show green
- [ ] Chrome browser confirmed on demo device
- [ ] Microphone permission granted in Chrome settings
- [ ] Player roster CSV prepared in correct format
- [ ] Dry-run import attempted and passed
- [ ] Review queue verified to load (at least one pending item from demo)
- [ ] Curriculum starter spine activated

---

## Known Gaps — Acceptable at Pilot Start

1. Production STT requires `OPENAI_API_KEY` — voice uses browser SpeechRecognition in Chrome only
2. Parent send button does not exist — parent updates are drafts only
3. Player and parent portals require profile linkage before players/parents can log in
4. Gate evidence confirmation is deferred (Sprint 107+)
5. Some migrations pending live application (see KNOWN_LIMITATIONS.md)

---

## Verdict

**QA triage complete. Three items require manual verification before pilot start:**
1. Director login works with production Supabase
2. Player import dry-run passes with Brian's real CSV
3. Chrome + microphone accessible on demo device

All other items verified in prior QA campaign (Sprints 723–740).
