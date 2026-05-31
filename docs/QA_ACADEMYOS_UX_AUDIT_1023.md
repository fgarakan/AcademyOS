# QA Checklist — AcademyOS 10/10 UX Audit Skill Pack (Sprint 1023)

**Date:** 2026-05-31
**Sprint:** 1023

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] `AUDIT_CRITERIA` has exactly 10 entries (one per `AuditDimensionId`)
- [ ] `AuditDimensionId` union has exactly 10 values
- [ ] `scoreToSeverity(9)` → `'pass'`
- [ ] `scoreToSeverity(3)` → `'critical'`
- [ ] `scoreToSprintReadiness(39)` → `'blocked'`
- [ ] `scoreToSprintReadiness(85)` → `'excellent'`

---

## `buildAuditReport` unit checklist

- [ ] 10 dimension scores of 10 → totalScore 100
- [ ] 10 dimension scores of 0 → totalScore 0
- [ ] Mixed scores → correct average
- [ ] `criticalFindings` only contains findings from score < 4 dimensions
- [ ] `topRecommendations` is max 3 items
- [ ] `sprintReadiness` matches `scoreToSprintReadiness(totalScore)`
- [ ] `auditedAt` is a valid ISO timestamp
- [ ] Never throws

---

## `DIRECTOR_DASHBOARD_PRE_1024_AUDIT` checklist

- [ ] `screenPath === '/director'`
- [ ] `totalScore` is between 60-70 (expected ~65)
- [ ] `primary_action_focus` dimension score is 4 (critical)
- [ ] `mobile_usability` dimension score is 5 (major)
- [ ] `donna_integration` dimension score ≥ 7 (pass — God Mode wired in Sprint 1011)
- [ ] `sprintReadiness === 'needs_work'`

---

## Safety / scope checklist

- [ ] `academyOsUxAudit.ts` has no DB imports
- [ ] `academyOsUxAudit.ts` has no Supabase imports
- [ ] `academyOsUxAudit.ts` has no React imports
- [ ] No mutations in any exported function
