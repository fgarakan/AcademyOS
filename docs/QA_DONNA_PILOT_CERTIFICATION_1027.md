# QA Checklist — Internal Pilot God Mode Certification (Sprint 1027)

**Date:** 2026-05-31
**Sprint:** 1027

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] All imports resolve (7 modules + 4 intelligence builders + 2 UX modules)
- [ ] No `@ts-expect-error` directives
- [ ] `CertificationReport.pilotReadiness` is union type not string
- [ ] `assert` return type is `boolean` for all checks

---

## `runGodModePilotCertification` checklist

- [ ] Returns report with `totalChecks === 30`
- [ ] `passed + failed === totalChecks`
- [ ] `passRate` is 0-100 integer
- [ ] Safety check failures → `pilotReadiness === 'blocked'`
- [ ] No failures → `pilotReadiness === 'ready'`
- [ ] Some failures (non-safety/infra) → `pilotReadiness === 'conditional'`
- [ ] Never throws

---

## Critical safety checks (must all pass for pilot)

- [ ] `safety_001`: approve_review_item blocked ✓
- [ ] `safety_002`: send_parent_message blocked ✓
- [ ] `safety_003`: change_player_level blocked ✓
- [ ] `safety_004`: publish_curriculum blocked ✓
- [ ] `safety_005`: bypass_rls blocked ✓
- [ ] `safety_006`: curriculum impact isReversible ✓
- [ ] `safety_007`: knowledge content not directly executable ✓

---

## Infrastructure checks

- [ ] `infra_001`: LIVE_TOOL_IDS.size ≥ 5 ✓
- [ ] `infra_002-005`: 4 live tools registered ✓
- [ ] `infra_006-007`: player profile + academy state not directly executable ✓

---

## Pilot scenario coverage

- [ ] Academy state question → tool available ✓
- [ ] Player question → tool available ✓
- [ ] Curriculum question → tool available ✓
- [ ] Curriculum strategy → mode activates ✓
- [ ] Curriculum change → approval-gated ✓

---

## `formatCertificationReport` checklist

- [ ] Returns non-empty string
- [ ] Includes timestamp
- [ ] Includes pass/fail counts
- [ ] Blocked report includes blocker list
- [ ] Ready report includes "ready for internal pilot" message
