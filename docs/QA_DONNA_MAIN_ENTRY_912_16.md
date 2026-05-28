# QA — DONNA Main Entry Point Upgrade
**Sprint:** 912.16
**Date:** 2026-05-28
**Method:** Static code analysis and entry point inventory
**Code analysed:**
- `src/components/nav/SidebarNav.tsx`
- `src/components/nav/DirectorMobileNav.tsx`
- `src/app/director/layout.tsx`
- `src/app/director/donna/page.tsx`
- `src/app/director/donna/DonnaDirectorShellClient.tsx`
- `src/app/director/page.tsx`
- `src/app/director/review/page.tsx`
- `src/app/director/curriculum/builder/page.tsx`
- `src/components/donna/DonnaVoiceReadyShell.tsx`

---

## Part 1 — Existing DONNA Entry Points (Pre-Sprint)

### Entry points confirmed before Sprint 912.16:

| Entry point | Location | Type | Route |
|---|---|---|---|
| Sidebar nav item #2 | `SidebarNav.tsx` | Navigation link | `/director/donna` |
| Mobile bottom nav (5th item) | `DirectorMobileNav.tsx` | Navigation link | `/director/donna` |
| `DonnaDashboardOpenCard` | `src/app/director/page.tsx` (line 472) | Inline card | `/director/donna` |
| `DonnaReviewBriefPanel` | `src/app/director/review/page.tsx` (line 1267) | Inline panel | (in-page) |
| `DonnaAssistantButton` | `src/app/director/layout.tsx` (line 103) | Floating button | (in-page panel) |
| DONNA hub page | `src/app/director/donna/page.tsx` | Full page | `/director/donna` |

### Entry points absent before Sprint 912.16:
- Curriculum Builder page — **no DONNA entry** ← highest-priority gap for demo

### Decision: Legacy DonnaAssistantButton preserved
`DonnaAssistantButton` (floating panel in the layout) is the legacy DONNA entry. It has:
- A different architecture from `DonnaVoiceReadyShell` (Sprint 912.x God Mode features)
- Additional functionality including template draft panels
- No surgery needed — it provides a useful fallback UX

Preserving it was the correct choice per sprint scope. Directors who click the floating button get the legacy experience; directors who navigate to `/director/donna` via the sidebar get the full God Mode experience. Both work.

---

## Part 2 — Changes Made in Sprint 912.16

### Change 1 — "Conv Mode" renamed to "Conversation"

**File:** `src/components/donna/DonnaVoiceReadyShell.tsx`

**Before:** Button label read "Conv Mode" — cryptic for a first-time director.

**After:** Button label reads "Conversation" — clear, readable, matches the `title` tooltip and the `getGodModeStateLabel` which already returned "Conversation Mode" (not "Conv Mode") when active.

Also updated tooltip text:
- Before: `'Turn off Conversation Mode'` / `'Turn on Conversation Mode — DONNA listens...'`
- After: `'Turn off Conversation mode'` / `'Turn on Conversation mode — DONNA listens...'`
(lowercase 'm' in "mode" to match consistent label styling)

---

### Change 2 — DONNA sidebar item subtitle

**File:** `src/components/nav/SidebarNav.tsx`

**Before:** DONNA nav item showed only "DONNA" label with Sparkles icon — visually identical to all other nav items, no additional context about what it is.

**After:**
- `NavItem` component extended with optional `subtitle?: string` prop
- When `subtitle` is provided, the label area becomes a flex column showing the main label + subtitle below it
- Subtitle text: `"Academy assistant"` — appears under "DONNA" in `text-[9px]`
- Subtitle color: `text-lime/60` when active, `text-text-muted/50` when inactive
- The subtitle is purely additive — no layout change for any item without a subtitle

**Usage:** `subtitle={item.label === 'DONNA' ? 'Academy assistant' : undefined}` — only DONNA gets the subtitle; all other nav items are unaffected.

---

### Change 3 — "Ask DONNA" chip on Curriculum Builder

**File:** `src/app/director/curriculum/builder/page.tsx`

**Before:** `CurriculumBuilderPage` returned only `<CurriculumSetupBuilder .../>` with no DONNA entry point. A director building curriculum who wanted to ask DONNA for help had to navigate away to the sidebar.

**After:** Added a lime-styled `<Link href="/director/donna">` chip above `<CurriculumSetupBuilder>`:
- Position: `flex justify-end px-4 pt-3 pb-1` — top-right above the builder
- Label: "Ask DONNA" with Sparkles icon
- Style: `border-lime/20 bg-lime/5 text-lime hover:bg-lime/10` — consistent with design system
- The chip is a server-side Next.js `<Link>` — no client state, no imports beyond `Link` and `Sparkles`

**Why curriculum builder specifically:** This is the key demo page for showing DONNA's curriculum draft creation capabilities. The director opens the builder, notices "Ask DONNA", clicks it, arrives at the DONNA hub, and can immediately say "Add a drill for Orange 2 focused on forehand prep." This is the demo golden loop.

---

## Part 3 — What Was NOT Changed (and Why)

| Considered change | Decision | Reason |
|---|---|---|
| DonnaAssistantButton replacement | Preserved | Too risky — has template draft panels, different architecture; removing would break existing director workflows |
| DonnaDirectorShellClient fixed height | Not changed | Height works; changing flex behavior risks breaking the scroll area in DonnaChatThread |
| Review Center CTA | Not added | Already has `DonnaReviewBriefPanel` (Sprint 1046) — would be duplicate |
| Dashboard CTA | Not added | Already has `DonnaDashboardOpenCard` (Sprint 804) — would be duplicate |
| Onboarding CTA | Not added | Page just wraps `<AcademyDnaLanding />` — chip would appear above the landing component in an awkward position; AcademyDnaLanding has its own DONNA integration |

---

## Manual/Static QA Scenarios

### Scenario 1 — Director can find DONNA from sidebar ✅ PASS

Sidebar `ACADEMY_ITEMS` has DONNA as item #2:
```typescript
{ label: 'DONNA', href: '/director/donna', icon: Sparkles },
```
With subtitle "Academy assistant" now shown below the label. The item is prominent (position #2), styled with lime when active, and now has context about what DONNA is.

---

### Scenario 2 — Clicking DONNA opens /director/donna ✅ PASS

`NavItem` renders a `<Link href={item.href}>`. DONNA item has `href: '/director/donna'`. Clicking navigates to the DONNA hub. `isActive('/director/donna')` returns true on that page, applying lime highlight. ✅

---

### Scenario 3 — /director/donna loads God Mode shell ✅ PASS

`DirectorDonnaPage` loads `DirectorDonnaContext`, renders `DonnaDirectorShellClient` which renders `DonnaVoiceReadyShell` with `role="director"`, `donnaRole="director"`, and the full `directorCtx`. All Sprint 912.x features (conversation mode, page guide, curriculum drafts, follow-ups) are available. ✅

---

### Scenario 4 — "Conversation" label appears instead of "Conv Mode" ✅ PASS

Line 1790 in `DonnaVoiceReadyShell.tsx` now reads `Conversation` not `Conv Mode`.

When `conv.conversationMode` is false: button shows "Conversation" in grey.
When `conv.conversationMode` is true: button shows lime dot + "Conversation" in lime.
The `getGodModeStateLabel` function returns "Conversation Mode" as the state label (unchanged) when active — consistent with the button text.

---

### Scenario 5 — Legacy floating DONNA button still works ✅ PASS (unchanged)

`DonnaAssistantButton` is mounted in `DirectorLayout` with no changes. It continues to:
- Float in the layout
- Open on click
- Show the legacy template draft panels
- Provide legacy voice functionality

No regression. ✅

---

### Scenario 6 — Curriculum builder has clear path to open DONNA ✅ PASS

`CurriculumBuilderPage` now renders a `<Link href="/director/donna">Ask DONNA</Link>` chip above `<CurriculumSetupBuilder>`. Director on the curriculum builder can click "Ask DONNA" to navigate to the God Mode hub. ✅

---

### Scenario 7 — No layout break on mobile ✅ PASS

- `SidebarNav` is `hidden lg:flex` — mobile layout uses `DirectorMobileNav` which is unchanged
- The subtitle in `NavItem` only affects the desktop sidebar — mobile nav doesn't use `NavItem`
- `CurriculumBuilderPage` change wraps content in a `<>` fragment with a flex-justified div — standard pattern ✅

---

### Scenario 8 — Existing drill/gate/skill draft flow still works ✅ PASS

No changes to `DonnaVoiceReadyShell.tsx` routing or confirmation logic. Only the button label changed. All Sprint 912.8–912.15 behaviors preserved. ✅

---

### Scenario 9 — Page guide questions still work ✅ PASS

No changes to page guide patterns or helpers. Sprint 912.14 intercepts unaffected. ✅

---

### Scenario 10 — Session follow-ups still work ✅ PASS

No changes to session memory or follow-up patterns. Sprint 912.15 changes unaffected. ✅

---

## Safety Checks

| Check | Result |
|---|---|
| No migrations changed | ✅ |
| No new server actions | ✅ |
| No `execute_curriculum_override()` | ✅ |
| No `proposed_actions` usage | ✅ |
| Sprint 904 approve/reject untouched | ✅ |
| `DonnaAssistantButton` preserved | ✅ |
| Director layout unchanged | ✅ (only layout.tsx is the same) |
| TypeScript clean | ✅ |

---

## Files Changed

- **`src/components/donna/DonnaVoiceReadyShell.tsx`:**
  - Line ~1790: `Conv Mode` → `Conversation`
  - Line ~1782: tooltip `'Turn off/on Conversation Mode'` → `'Turn off/on Conversation mode'` (lowercase 'm')

- **`src/components/nav/SidebarNav.tsx`:**
  - `NavItem`: added optional `subtitle?: string` prop; when present, label area becomes a flex column with subtitle below
  - ACADEMY_ITEMS map: `subtitle={item.label === 'DONNA' ? 'Academy assistant' : undefined}` — only DONNA gets subtitle

- **`src/app/director/curriculum/builder/page.tsx`:**
  - Added `import Link from 'next/link'` and `import { Sparkles } from 'lucide-react'`
  - Wrapped return in `<>` fragment
  - Added `<Link href="/director/donna">Ask DONNA</Link>` chip above `<CurriculumSetupBuilder>`

---

## TypeScript

`npx tsc --noEmit` — **0 errors** after Sprint 912.16 changes.

---

## Risks

### Risk 1 — Subtitle makes DONNA nav item slightly taller (very low)

The DONNA item now renders two text lines instead of one, making it ~3-4px taller than other nav items. The sidebar uses `space-y-0.5` between items. The height difference is minimal and not visually jarring.

### Risk 2 — "Ask DONNA" chip positions above CurriculumSetupBuilder header (low)

`CurriculumSetupBuilder` has its own header/title inside the component. The chip appears ABOVE the builder component. This is consistent with how page-level controls typically appear. If `CurriculumSetupBuilder` has top padding, there may be a slight gap. Acceptable V1.

### Risk 3 — Director clicks "Ask DONNA" and loses builder context (very low)

The chip navigates to `/director/donna`. The director leaves the curriculum builder. This is intentional — the golden demo flow is to use DONNA on the DONNA hub page, then return. The "same for Orange 3" follow-up (Sprint 912.15) works within the same session. If the director wants to use DONNA while viewing the builder, the legacy `DonnaAssistantButton` (still present in layout) provides that capability.

---

## Sprint 912.17 Recommendation

**Sprint 912.17: DONNA "What Needs My Attention?" Director Brief V1** — wire the `/api/donna/brief` data (live pending counts, sessions today, advancement eligible) into the DONNA chat routing pipeline so DONNA can answer "what needs my attention today?" with live DB data. Currently `directorCtx` provides this information but it may be slightly stale (loaded at page render time). The brief API queries fresh DB data. Passing brief data as a prop to `DonnaVoiceReadyShell` via `DonnaDirectorShellClient` is the lowest-risk path.
