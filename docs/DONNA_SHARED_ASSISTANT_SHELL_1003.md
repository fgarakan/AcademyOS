# DONNA Shared Assistant Shell
Sprint 1003 — 2026-05-18

## Summary

Created `src/components/donna/DonnaAssistantShell.tsx` — a presentational layout wrapper for DONNA panels across Director and Coach portals.

## Why This Was Needed

`src/components/assistant/DonnaPanelShell.tsx` exists but is intentionally empty (Sprint 384 comment explains: state coupling prevents extraction — closePanel, draft restore, review queue prefetch all close over 15+ state setters). The existing `DonnaAssistantButton` (src/components/assistant/) is the full stateful implementation.

`DonnaAssistantShell` is different: it is a pure layout component with no state. Callers provide content via `children` and `quickActions` props. This makes it composable for new Director DONNA pages and Coach DONNA surfaces that don't need the full button/panel state machine.

## Component Props

| Prop | Type | Purpose |
|---|---|---|
| `role` | `director \| coach \| parent \| player \| platform` | Drives role badge color + label |
| `title` | string | Panel title (default: "DONNA") |
| `subtitle` | string | Subtitle under the title |
| `statusLabel` | string | Status pill (e.g., "Active") |
| `contextLabel` | string | Section label above context chips |
| `contextItems` | string[] | Context chips (session name, level, player count) |
| `quickActions` | DonnaQuickAction[] | Action links or buttons at the bottom |
| `safetyLabel` | string | Footer safety copy |
| `mode` | DonnaAssistantMode | Variant mode (command, briefing, wrap_up, review, support) |
| `children` | ReactNode | Body content slot |

## Design

- Matches AcademyOS dark/lime aesthetic
- `bg-surface` card with `border-border`
- Lime Sparkles icon header
- Role badge with per-role color
- Context chips in `bg-surface-raised` strip
- Quick actions with lime hover
- Safety footer in `text-muted`

## Relation to Existing DONNA Components

This shell wraps around components like `DONNAAcademyPulseCard`, `DONNAAnswerCard`, `DONNAReviewQueueSummary`, etc. It does NOT replace `DonnaAssistantButton` — that is the full stateful panel used on most director screens already.

## Usage

```tsx
<DonnaAssistantShell
  role="director"
  title="DONNA"
  subtitle="Academy COO Assistant"
  statusLabel="Active"
  contextLabel="Today"
  contextItems={['3 sessions', '2 pending reviews', '1 exception']}
  safetyLabel="All suggested actions require director review before anything changes."
  quickActions={[{ label: 'Open Review Queue', href: '/director/review' }]}
>
  <DONNAAcademyPulseCard />
</DonnaAssistantShell>
```
