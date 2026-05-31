# QA Checklist — Academy Philosophy Profile (Sprint 1019)

**Date:** 2026-05-31
**Sprint:** 1019

---

## TypeScript checklist

- [ ] `npx tsc --noEmit` passes
- [ ] All types and functions in `academyPhilosophyProfile.ts` are exported correctly
- [ ] `CurriculumStage` union complete (red/orange/green/yellow/purple/custom)
- [ ] `DevelopmentEmphasis` union complete
- [ ] `ContentDomainPriority.priority` is `1 | 2 | 3 | 4 | 5` (not `number`)
- [ ] No `as any` introduced

---

## `buildDefaultPhilosophyProfile` unit checklist

- [ ] `totalLevels: 5` → primaryStages includes red/orange/green/yellow
- [ ] `totalLevels: 3` → primaryStages is ['red', 'orange']
- [ ] `totalLevels: 1` → primaryStages is ['red']
- [ ] `totalLevels: 0` → primaryStages is ['red']
- [ ] `academyName: 'Dabul Tennis'` → profileName is 'Dabul Tennis Philosophy Profile'
- [ ] `source === 'derived'` always for default profile
- [ ] `hasFormalCurriculum: false` when `totalLevels === 0`
- [ ] `hasFormalCurriculum: true` when `totalLevels > 0`
- [ ] `hasCompetitiveProgram: false` when `totalLevels < 3`
- [ ] `hasCompetitiveProgram: true` when `totalLevels >= 3`
- [ ] Never throws

---

## `buildPhilosophyContextString` unit checklist

- [ ] Output includes "Academy Philosophy Context" header
- [ ] Output includes primaryStages
- [ ] Output includes developmentEmphasis
- [ ] Output includes top 3 content domains by priority
- [ ] `source === 'derived'` → includes derived disclaimer note
- [ ] Output does not contain player names
- [ ] Output does not contain coach performance data
- [ ] Output is non-empty for any valid profile

---

## `identifyPhilosophyGaps` unit checklist

- [ ] `hasAnyContent: false` → returns gap with "No curriculum content has been defined yet"
- [ ] `hasAnyContent: true, stagesCovered: ['red']` on profile with `primaryStages: ['red', 'orange']` → returns gap for 'orange'
- [ ] `stagesCovered` covers all primaryStages → returns empty array
- [ ] Never throws

---

## Safety checklist

- [ ] No player names in any output
- [ ] No coach performance data
- [ ] `buildPhilosophyContextString` never returns private notes
- [ ] Gap signals are framed as signals, not directives

---

## Sprint 1018 regression checklist

- [ ] `curriculumStrategyConversation.ts` NOT changed
- [ ] `contextPacket.ts` curriculum strategy injection unchanged
