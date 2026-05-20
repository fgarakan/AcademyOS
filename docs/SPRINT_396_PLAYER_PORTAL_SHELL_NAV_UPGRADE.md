# Sprint 396 — Player Portal Shell + Nav Upgrade V1

## What Sprint 395 found

Sprint 395 audited both portal prototypes against the current AcademyOS implementation.

**Player portal parity: 5/10**

The biggest mismatch was navigation reach. The prototype has a 10-item sidebar (desktop) and hamburger drawer (mobile) giving the player direct access to every section from any screen. AcademyOS had a 3-tab BottomTabBar:
- Home
- Missions
- Ask DONNA

Skill Path, Competition, Fitness, Level Up, Practice, and Achievements were only reachable via the home card grid — invisible from every other player page.

All 9 destination routes existed. The gap was the shell, not the pages.

---

## Shell / nav before Sprint 396

`src/app/player/layout.tsx` — Server Component
- `min-h-screen pb-24` wrapper
- `<main className="p-4 max-w-lg mx-auto">` content area
- `<BottomTabBar>` fixed to bottom with 3 tabs: Home, Missions, Ask DONNA
- No sidebar on desktop
- No access to Skill Path / Competition / Fitness / Level Up / Practice / Achievements from any non-home page

---

## Shell / nav after Sprint 396

### New component: `src/components/player/PlayerPortalShell.tsx`

`'use client'` — uses `useState` (drawer) and `useEffect` (close drawer on pathname change).

Props: `{ children: React.ReactNode, firstName?: string | null, levelName?: string | null }`

#### Desktop (lg and above)
- Sticky left sidebar `w-60 h-screen bg-surface border-r border-border`
- Brand header: AOS logo mark (lime) + "AcademyOS / Player Portal" label
- Player identity section: initials avatar (bg-surface-raised border-border text-lime) + first name + level pill with lime dot — only renders when `firstName` or `levelName` is provided
- 9-item nav list with active state: `bg-lime/10 text-lime border-l-[2px] border-lime`
- Inactive state: `text-text-secondary hover:text-text-primary hover:bg-surface-raised`
- Footer: "Keep training. Keep growing." in `text-text-muted text-[10px]`
- Content area: `flex-1 min-w-0 p-4 lg:p-6` (no top padding on desktop)

#### Mobile (below lg)
- Fixed top header `h-[52px] bg-surface border-b border-border`
- Left side: AOS logo mark + current page label (derived from active nav item)
- Right side: hamburger / X toggle button
- Slide-out drawer: `w-64 pt-[52px] bg-surface border-r border-border` — player identity section + full 9-item nav
- Backdrop: `bg-black/50` click dismisses drawer
- Content area: `pt-[52px]` clears the fixed header + `p-4 lg:p-6`
- `useEffect` on `pathname` closes drawer automatically on route change

#### Nav items

| Label | Route | Icon | Active logic |
|---|---|---|---|
| Home | `/player` | House | exact match |
| Missions | `/player/missions` | Map | startsWith |
| Skill Path | `/player/skill-path` | Zap | startsWith |
| Competition | `/player/competition-path` | Trophy | startsWith |
| Fitness | `/player/fitness-path` | Activity | startsWith |
| Level Up | `/player/level-up` | ArrowUp | startsWith |
| Practice | `/player/practice` | Dumbbell | startsWith |
| Achievements | `/player/celebration` | Star | startsWith |
| Ask DONNA | `/player/ask-donna` | MessageCircle | startsWith |

### Updated: `src/app/player/layout.tsx`

Still a Server Component.

Added lightweight sequential reads (guarded):
1. Profile select expanded to `has_seen_first_run_deck, academy_id`
2. If `user && academy_id`: read `players.first_name, curriculum_level_id` filtered by `profile_id + academy_id + is_active`
3. If `playerRow?.curriculum_level_id`: read `curriculum_levels.display_name`

No DB writes. No mutations. All reads are guarded and `maybeSingle()` — null-safe.

Replaced:
```
<div className="min-h-screen pb-24">
  <main className="p-4 max-w-lg mx-auto">...</main>
  <BottomTabBar items={PLAYER_TABS} />
</div>
```

With:
```
<PlayerPortalShell firstName={firstName} levelName={levelName}>
  <PreviewBanner />
  <FirstRunDeckGate ...>
    {children}
  </FirstRunDeckGate>
</PlayerPortalShell>
```

`PreviewBanner` and `FirstRunDeckGate` are preserved inside the shell content area.

---

## Routes added or wrapped

No new routes created. All 9 routes existed before Sprint 396.

| Route | Before | After |
|---|---|---|
| `/player` | Existed, reachable via tab 1 | Exists, reachable via sidebar/drawer item 1 |
| `/player/missions` | Existed, reachable via tab 2 | Exists, reachable via sidebar/drawer item 2 |
| `/player/skill-path` | Existed, only via home card grid | Exists, reachable via sidebar/drawer item 3 |
| `/player/competition-path` | Existed, only via home card grid | Exists, reachable via sidebar/drawer item 4 |
| `/player/fitness-path` | Existed, only via home card grid | Exists, reachable via sidebar/drawer item 5 |
| `/player/level-up` | Existed, only via home card grid | Exists, reachable via sidebar/drawer item 6 |
| `/player/practice` | Existed, only via home card grid | Exists, reachable via sidebar/drawer item 7 |
| `/player/celebration` | Existed (stub), only via home card grid | Exists (stub), reachable via sidebar/drawer item 8 |
| `/player/ask-donna` | Existed, reachable via tab 3 | Exists, reachable via sidebar/drawer item 9 |

---

## Placeholder pages created

None. All 9 routes existed before this sprint.

`/player/celebration` is a stub page (Sprint 1068) that clearly says "Celebration view coming soon" and links back to Home — preserved unchanged.

---

## What remains for later sprints

| Sprint | Work |
|---|---|
| Sprint 397 | Player Home visual upgrade — hero card richness, 6-card path grid (currently 4), streak display, mission progress |
| Sprint 398 | Player Missions visual upgrade — gamified cards with evidence, rewards, progress bars |
| Sprint 399 | Player Path pages (Skill / Competition / Fitness) — visual upgrade to match prototype cards |
| Sprint 400 | Player support pages — Level Up gate checklist upgrade, Practice drill checklist, Ask DONNA chip richness |
| Sprint 401 | Player Celebration page — badge display, mission reveal flow |
| Future | Desktop layout widening — current player pages use single-column content; will need responsive grid layouts for desktop views |
| Future | Mission Detail page (`/player/missions/[priorityId]`) — not in the nav, deep-linked from Mission Map |

---

## Safety decisions

- Player identity in sidebar/drawer shows only `firstName` and curriculum `display_name`. No internal notes, rankings, comparisons, or unapproved level movement claims.
- Level pill shows the curriculum level name from `curriculum_levels.display_name` only — not derived from any gated assessment state.
- `PlayerPortalShell` exposes no coach notes, director notes, parent messages, or internal priority data.
- Celebration page stub explicitly says "When your director confirms a mission complete" — no fake completion claim.
- No DONNA references changed. Spelling "DONNA" preserved throughout.
- No DANA references anywhere.

---

## TypeScript

Clean — zero errors before and after changes.

---

## Next sprint recommendation

**Sprint 397 — Player Home Visual Upgrade V1**

Upgrade `/player/page.tsx` to match prototype home layout:
- Hero card visual richness: mission name, level progress ring, streak counter
- Expand path grid from 4 cards to 6 (add Level Up and Practice cards)
- DONNA chip row with contextual quick-action chips
- Preserve all existing IDP data, auth guards, safety rules

Prerequisite: Sprint 396 complete (nav shell in place so each path card navigates directly). Done.
