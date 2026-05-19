# Sprint 1098 — Director DONNA Academy Pulse Card V1

## What was built

Wired the existing `DONNAAcademyPulseCard` component into the director DONNA page left column. The pulse card renders between "Today at a Glance" and "Attention Needed" to give directors a one-glance academy health score.

## Files modified

- `src/app/director/donna/page.tsx` — imported `DONNAAcademyPulseCard` and `PulseTrend`; added pulse card block in left column

## Files created

- `docs/DIRECTOR_DONNA_PULSE_CARD_1098.md` — sprint doc

## Data derivation

| Prop | Derivation |
|---|---|
| `healthScore` | `100 - (highRisk * 15) - (medRisk * 5) - (missingWrapUps * 3)`, clamped min 0; `null` in demo mode |
| `trend` | `unknown` (demo) / `down` (any high-urgency risk) / `up` (no attention items) / `stable` (otherwise) |
| `trendNote` | First `academyRisks[0].signal` string, or null |
| `urgentItems` | `pendingReviews` |
| `atRiskPlayers` | `attentionItems.filter(i => i.risk === 'high').length` |
| `isLive` | `ctx.isLive` |
| `lastUpdatedLabel` | `"Just now"` when live, `null` in demo mode |

## TypeScript

Clean.
