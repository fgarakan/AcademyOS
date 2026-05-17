# Brian Demo Dataset Final Pass — Sprint 742

**Date:** 2026-05-17
**Sprint:** 742 — Brian Demo Dataset Final Pass V1

---

## 1. Purpose

Confirm that the demo sandbox dataset (players, group, session, curriculum version) is:
- Correctly scoped to demo-only records (tagged `[DEMO]%`)
- Aligned with the Brian Voice Demo Script voice prompts
- Isolated from real academy data
- Honest about its demo status (labeled everywhere it appears)

---

## 2. Demo Player Alignment

The Brian Voice Demo Script Step 8 voice prompt is:

> "Everyone was here except Sarah. Mia improved recovery after wide balls. Leo still needs better contact spacing."

This requires the demo session to have players named **Sarah**, **Mia**, and **Leo** in the demo group.

**Source:** `src/app/director/demo/demoSandboxActions.ts` — `createDemoSandboxAction()`

The demo sandbox creates 6 players with `[DEMO]` prefix. Names visible in demo page Section 5 include Mia, Leo, and Sarah (confirmed via demo page rendering logic at `page.tsx:327`).

**Status:** ALIGNED — voice prompt names match demo player names.

---

## 3. Voice Prompt Alignment

| Script Step | Voice Prompt | Source in Code | Status |
|---|---|---|---|
| Step 3 — Curriculum | "For our Orange 2 players, I want more return-of-serve readiness before Orange 3." | `VoiceOverrideInputPanel.tsx:54` | ALIGNED |
| Step 8 — Session Recap | "Everyone was here except Sarah. Mia improved recovery after wide balls. Leo still needs better contact spacing." | `VoiceCoachRecapInput.tsx:53` | ALIGNED |

Both demo prompts match the Brian Voice Demo Script exactly.

---

## 4. Demo Data Labeling Audit

| Data Object | Demo Label | Location | Status |
|---|---|---|---|
| Demo players | `[DEMO]` prefix stripped for display; "DEMO" badge shown | `page.tsx:339` | CORRECT |
| SandboxBanner | "Preview Mode — This demo uses sample academy data..." | `page.tsx:111–119` | CORRECT |
| Sample Player Data section | "Once Brian's real roster is uploaded, this section is replaced by actual academy players." | `page.tsx:322–325` | CORRECT |
| Demo session link | "Open Demo Session" with lime border to distinguish | `page.tsx:296–309` | CORRECT |
| Demo curriculum version | Created with `[DEMO]` prefix in `demoSandboxActions.ts` | `demoSandboxActions.ts:~454` | CORRECT |

No demo data appears without a label distinguishing it from live data.

---

## 5. Sandbox Isolation Audit

**`demoSandboxActions.ts` isolation:**
- All demo players are created with `full_name` starting with `[DEMO]`
- All demo actions check for `[DEMO]%` prefix before returning player data to avoid mixing with real players
- `assertNotPreviewMode()` is called at the top of all mutating sandbox actions — confirmed in Sprint 721 QA
- Demo session ID is stored and surfaced separately from real sessions
- Demo curriculum version is tagged and separate from the active academy curriculum version

**Conclusion:** Sandbox is correctly isolated. No demo record can contaminate real academy data.

---

## 6. Demo Path vs. Script Alignment

The 11-step demo path on `/director/demo` covers:
1. Import roster → 2. Review players → 3. Assign curriculum → 4. Explore curriculum → 5. Create template → 6. Generate lesson plan → 7. Schedule session → 8. Open as coach → 9. Submit wrap-up → 10. Review wrap-up → 11. Close loop

The Brian Voice Demo Script covers:
1. Demo sandbox → 2. Curriculum customization → 3-4. Speak + submit curriculum prompt → 5. Review queue → 6-7. Open session + speak recap → 8. Save recap → 9-10. Explain model

**Assessment:** The 11-step path is a comprehensive walkthrough. The Brian script is the abbreviated "wow moment" path. Both are valid. They are complementary, not contradictory. The `DemoScriptPanel` added in Sprint 741 surfaces the Brian script steps directly on the demo page so both paths are accessible.

---

## 7. Known Gaps

| Gap | Impact | Status |
|---|---|---|
| Demo group name not shown on demo page | Minor — group name visible in sandbox status cards | Acceptable V1 |
| Demo template details not surfaced | Minor — director can navigate to class templates | Acceptable V1 |
| Sandbox reset doesn't reset curriculum override drafts in review queue | Low — review queue shows old demo drafts alongside new ones | Acceptable V1 |

No blocking gaps for the pilot demo.

---

## 8. Conclusion

**Brian Demo Dataset: ALIGNED.**

- Demo players include Sarah, Mia, and Leo (matching the voice prompt)
- Both demo voice prompts match the Brian Voice Demo Script exactly
- All demo data is labeled and isolated from real academy data
- Sandbox isolation is correct — no demo action can mutate real data
- Demo path on `/director/demo` is comprehensive and the Brian script is surfaced via DemoScriptPanel (Sprint 741)

**Sprint 742: PASSED.**
