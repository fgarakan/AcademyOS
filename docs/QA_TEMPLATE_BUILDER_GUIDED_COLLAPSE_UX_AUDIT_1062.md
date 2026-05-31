# QA Checklist — Sprint 1062 — Template Builder Guided Collapse UX Audit V1

**Date:** 2026-05-31
**Sprint:** 1062
**Note:** This sprint is documentation-only. QA confirms the audit is accurate.

---

## Audit accuracy checks

### Fitness Builder — confirm audit findings

- [ ] Open `/director/fitness/templates/[templateId]` for a fitness template with ≥3 blocks and ≥2 exercises each
- [ ] Confirm all blocks are fully expanded on page load — no collapsed state exists
- [ ] Confirm all exercise rows are visible without any expand action
- [ ] Confirm reorder (↑↓) and delete (🗑) buttons are always visible in block headers
- [ ] Confirm observation/notes inline text is visible (not behind a disclosure) when a block has notes
- [ ] Confirm there is no "Expand All / Collapse All" button
- [ ] Confirm step labels: "Development Focus, Training Goal, Physical Blocks, Tennis Transfer, Review + Save"
- [ ] Note: Step 2 "Training Goal" shows the meta editor (name, description, duration) — not a goal selector

### Class Builder — confirm audit findings

- [ ] Open `/director/class-templates/[templateId]` for a class template
- [ ] Confirm all blocks are fully expanded on Step 3 — no collapsed state
- [ ] Confirm CurriculumLevelSelector is embedded in Step 1 (Class Identity), not Step 2
- [ ] Confirm step labels: "Class Identity, Class Structure, Build Blocks, Coach Preview, Review + Apply"
- [ ] Confirm Step 4 "Coach Preview" shows drill detail (cues, progressions, regressions) fully expanded for every block
- [ ] Confirm no "Coach Notes" step exists separate from the preview

---

## Cognitive load observation

- [ ] Count: with a 7-block fitness template, how many distinct controls are simultaneously visible on Step 3?
  - Expected: 7 blocks × (2 reorder + 1 delete + 1 observe + N exercises × (1 switch + 1 remove)) = very high
  - This confirms the audit finding that cognitive load is high before orientation

- [ ] For a class template with 6 blocks, how much vertical scroll is required on Step 3 (Build Blocks)?
  - Expected: significant scroll even with minimal content per block
  - This confirms the need for collapsed-by-default blocks

---

## Implementation readiness checks

- [ ] `FitnessBlockCard` at line 344 in `FitnessTemplateBuilderClient.tsx` — confirm it has no `isExpanded` prop today
- [ ] Confirm `FitnessTemplateBuilderClient` has no `expandedBlockId` state today
- [ ] Confirm `ClassTemplateBuilderStepper` Step 3 has no collapse logic in `BlockContentPickerCard`
- [ ] Confirm `src/components/ui/index.ts` — is there a `Disclosure` or `Collapsible` component already?
  - If yes: use it in Sprint 1064/1065
  - If no: build `CollapsibleBlockRow` in Sprint 1064

---

## Risk observations

- [ ] Collapse/expand state for blocks must NOT affect the block's save state — expanding/collapsing is purely display
- [ ] Auto-populate exercises button in Step 3 header must remain accessible even when all blocks are collapsed
- [ ] "Add Fitness Block" button at the bottom of the list must remain accessible when blocks are collapsed
- [ ] When a director expands Block 3 and then clicks "Expand All", all blocks should expand — Block 3 stays expanded

---

## TypeScript projection

The following new types/props will be needed in Sprint 1065:
```ts
// FitnessBlockCard new props
isExpanded: boolean
onToggle: () => void

// FitnessTemplateBuilderClient new state
const [expandedBlockId, setExpandedBlockId] = useState<string | null>(
  initialBlocks[0]?.id ?? null  // auto-expand first block
)
const [expandAll, setExpandAll] = useState(false)
```

No backend changes needed. No schema changes needed.
