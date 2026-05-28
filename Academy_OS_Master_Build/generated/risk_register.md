# RISK REGISTER
**Generated:** 2026-04-27

| ID | Risk | Severity | Likelihood | Status | Mitigation |
|---|---|---|---|---|---|
| R01 | No Supabase project connected | Critical | Certain | Open | Resolve immediately — see Step 2 in recommended_next_steps.md |
| R02 | No auth system designed/built | Critical | Certain | Open | Confirm auth method (T3), build in Phase 1 |
| R03 | RLS policies untested | High | Certain | Open | Test after Supabase setup, see RLS_TESTING_GUIDE.md |
| R04 | No framework initialized | High | Certain | Open | Initialize Next.js project after decisions confirmed |
| R05 | Voice AI model not selected | Medium | High | Open | Not blocking V1 (V1 uses typed input) |
| R06 | Parent portal scope unclear | Medium | High | Open | Recommended: defer to V2 — confirm this decision |
| R07 | Multi-academy refactor cost | Medium | Low | Open | Mitigated: academy_id on all tables from day one |
| R08 | Claude API cost at scale | Medium | Medium | Open | Use prompt caching, rate limiting, async processing |
| R09 | Coach adoption of voice features | Medium | Medium | Open | Mitigated: V1 doesn't require voice. Build trust first with data value. |
| R10 | Assessment rubric not calibrated | Low | Medium | Open | Override rate monitoring will surface miscalibration |
| R11 | `execute_approved_action()` action type coverage incomplete | Low | High | Open | Only 3 of 14 action types implemented. Flag missing handlers before voice feature goes live. |
| R12 | TypeScript types out of sync with schema | Low | High | Open | Regenerate after every migration: `supabase gen types typescript` |
