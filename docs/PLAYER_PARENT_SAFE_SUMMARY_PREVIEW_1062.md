# Sprint 1062 — Player Parent-Safe Summary Preview V1

## What was built

A director-facing preview showing exactly what parents/players could safely see — and what is intentionally hidden. Preview only. Nothing is sent or published via this component.

## Files created

- `src/components/player/PlayerParentSafeSummaryPreview.tsx` — parent-safe preview card
- `docs/PLAYER_PARENT_SAFE_SUMMARY_PREVIEW_1062.md` — sprint doc

## Files modified

- `src/app/director/players/[playerId]/page.tsx` — imports `PlayerParentSafeSummaryPreview` and `getPlayerParentSafeSummaries`; fetches parent-safe data alongside timeline; renders after `ParentGuidancePreviewPanel`

## Component behavior

Props: parentSafeData, isSchemaMissing, playerFirstName, currentFocus, nextStep, parentSupportTip.

Approval banner: orange warning — "Requires approval before parent/player visibility. Nothing shown here is sent automatically."

"What parents could see" section:
- What player is working on (devFocus / currentFocus)
- Recent progress / strengths (from approved development summary, show_to_parent=true)
- Next focus (things_to_work_on[0])
- How parent can support (parentSupportTip prop)
- Next development step
- Parent-visible requirements (from v_player_requirement_progress_detail where is_parent_visible=true)
- Empty state if no approved content

"Intentionally hidden" section (hard-coded list):
- Raw coach observation notes
- Internal director comments and flags
- Assessment scores and benchmark comparisons
- Sensitive behavioral or injury flags
- Unapproved AI interpretations
- Rankings or comparisons to other players

Footer: "Parent/player visibility controlled by show_to_parent and is_parent_safe flags. Director approval required."

## Data source

`getPlayerParentSafeSummaries()` — already in repository. Returns development_summary (show_to_parent gate), parent-safe evidence links, parent-visible requirements from view.

## Safety

- Preview only
- No sending, no publishing
- No parent access via this component
- Explicit approval banner on every render
- Hidden items list is hard-coded (cannot be toggled off)

## TypeScript

Clean.
