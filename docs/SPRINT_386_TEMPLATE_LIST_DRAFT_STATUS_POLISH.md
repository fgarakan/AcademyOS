# Sprint 386 — Template List Draft Status Polish V1

**Date:** 2026-05-19
**Branch:** main

Templates created by Sprint 384 (class) and Sprint 385 (fitness) builders include `status:draft` in their tags. Before this sprint, list pages showed "Active" for those templates (since `is_active: true` is set on insert), ignoring the draft tag.

## Changes

### `src/app/director/class-templates/page.tsx`
- `TemplateRow`: derived `isDraft` from `(template.tags ?? []).includes('status:draft')`
- Badge logic: if `isDraft`, renders "Draft" pill (`border-border text-text-secondary`); otherwise Active/Inactive as before

### `src/app/director/fitness/templates/page.tsx`
- `FitnessTemplateCard`: derived `isDraft` from already-available `tags` array
- Same badge replacement: "Draft" pill for `status:draft` templates, Active/Inactive otherwise

## Badge styling

"Draft" uses `border-border text-text-secondary` — a neutral muted style, distinct from both Active (green) and Inactive (muted). No warning/accent color used.

## No other changes

Empty states, CTAs, block counts, curriculum stats, and all other list UI unchanged.

TypeScript clean.
