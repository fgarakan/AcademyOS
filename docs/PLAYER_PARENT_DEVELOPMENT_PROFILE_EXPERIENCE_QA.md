# Player + Parent Development Profile Experience — QA Checklist

Sprint 175 | 2026-05-02

---

## QA Tests

1. **Director player profile loads**
   - Navigate to `/director/players/[playerId]`
   - Page renders without errors
   - PlayerProfileHeader shows player name and level

2. **Development Summary card appears in Overview tab**
   - `DevelopmentProfileSummaryCard` renders in the left column of the Overview tab
   - "Internal coach view" badge is visible
   - Shows empty state message if no summary data exists

3. **Doing Well / Working On / Current Focus / Next Step labels appear**
   - In `DevelopmentProfileSummaryCard` (Overview tab)
   - In `DevelopmentSummarySection` (Notes tab)
   - In `CoachPlayerSnapshot` (Notes tab)
   - In `ProgressEvidenceTimeline` (Notes tab)
   - Labels use positive development language throughout

4. **"Weaknesses" does not appear anywhere in parent/player-facing UI**
   - `src/app/parent/page.tsx` — no "weaknesses" text
   - `src/app/player/page.tsx` — no "weaknesses" text
   - `ParentSafeProgressPreview` component — no "weaknesses" text
   - `PlayerMissionPreview` component — no "weaknesses" text

5. **Progress Evidence Timeline appears or safe empty state appears**
   - `ProgressEvidenceTimeline` renders in the Notes tab
   - Empty state shows "No evidence yet" if no observations exist
   - Each item shows visibility pill (Internal / Coach note)
   - Content is truncated at 180 characters

6. **Coach Snapshot appears in Notes tab**
   - `CoachPlayerSnapshot` renders at the top of the Notes tab
   - Shows Current Focus, Doing Well, Working On, Next Priority, Recent Note
   - Shows empty/minimal state when no data is available

7. **Parent-safe preview appears and does not expose raw coach notes**
   - `ParentSafeProgressPreview` renders on `/parent` page
   - "Preview only" lock badge is visible
   - Empty state: "Progress summaries will appear here after coach/director review."
   - No raw `coach_observations` content is shown

8. **Player mission preview appears and does not expose raw coach notes**
   - `PlayerMissionPreview` renders on `/player` page
   - Empty state: "Your next mission will appear after your coach reviews your progress."
   - No internal coach/director data is shown

9. **Level Progress card appears or safe planned state appears**
   - `LevelProgressCard` renders in the Overview sidebar
   - Shows Current → Next level with ArrowRight
   - Shows advancement status (CheckCircle2 green / Clock muted)
   - Shows "Requires director approval" when `requires_director_approval` is true
   - Empty state: "Level requirements will appear as curriculum requirements are connected."

10. **Dashboard Active Players drilldown links to player profile**
    - Navigate to `/director/players/active`
    - Each player row is a Link to `/director/players/[playerId]`
    - "Current Focus" label shown for focus areas (not "Working on:")

11. **Academy Improvement drilldown links to player profile**
    - Navigate to `/director/improvement`
    - Each player row is a Link to `/director/players/[playerId]`
    - "Working On" label shown for focus areas

12. **No communications sent**
    - None of the new components send email, push, or SMS
    - No Slack or external API calls
    - Confirmed: all components are display-only

13. **No parent/player publishing enabled**
    - `ParentSafeProgressPreview` shows `isPreviewOnly={true}` by default
    - No `show_to_parent` or `show_to_student` flags mutated
    - No parent/player facing pages receive raw internal data

14. **No player level movement occurs**
    - `LevelProgressCard` is read-only
    - No calls to `finalize_player_placement()` or level-mutation functions
    - No `player_curriculum_states` mutations

15. **TypeScript passes**
    - `npx tsc --noEmit` exits with 0 errors
    - Confirmed clean after all Sprint 166–175 changes
