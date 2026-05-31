# QA — Coach Session Detail UX — Sprint 1045

**Sprint:** 1045 | **Date:** 2026-05-31

---

## Removed — confirm absent

- [ ] **Snapshot notice NOT visible** ("Execution updates are saved to this session only — the master template is not changed.")
- [ ] **No two-sentence After Session text** — only single-sentence "Use Wrap-Up Session for your end-of-session recap."

## Preserved — confirm present

- [ ] Session header (name, date, time, template badge, curriculum level badge, block rail)
- [ ] Player Watch List shows when roster exists
- [ ] Today's Plan shows when template_id exists
- [ ] "Run the Session" section with blocks and execution client
- [ ] Attendance incomplete prompt (orange) when unmarked players
- [ ] "Start Wrap-Up →" link when no wrap-up submitted
- [ ] DONNA chip in After Session when no wrap-up
- [ ] CoachWrapUpDetailPanel, CoachWrapUpStatusCard, CoachSessionActions
- [ ] Quick internal note (CoachRecapCommandPanel)

## Regression

- [ ] Session execution flow unchanged
- [ ] Wrap-up flow unchanged
- [ ] TypeScript: `npx tsc --noEmit` passes clean
