# Director Review Queue 10/10 — Architecture
**Sprint:** 923 | **Date:** 2026-05-29

---

## 1. What Changed

Added `DonnaReviewTabGuide` component at the top of each review queue tab. Shows:
- Tab purpose (what's here)
- Priority guidance (what to review first)
- Safety model (how approval/rejection works)

Sprint 904 approve/reject behavior is unchanged. All approval/rejection/application paths remain identical.

---

## 2. V2 Gaps

1. Tab filtering by type (within each tab) not yet built
2. Defer/snooze action not yet available
3. Review queue deep-link from DONNA not yet wired to tab-specific guidance
