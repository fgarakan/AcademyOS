# Sprint 813 — Director Daily Command Landing Page V1

**Date:** 2026-05-25
**Sprint:** 813
**Type:** UX restructuring — director landing page from scrolling dashboard to no-scroll Daily Command screen
**Files changed:** 1 source + 2 docs
**Migrations:** None
**DB mutations:** None
**TypeScript:** Clean

---

## Why this sprint

User feedback:

> "I shouldn't need to scroll all the way down."
> "There shouldn't be a big scroll."

Strategic product decision:

> If DONNA is 10/10 conversational and context-aware, most data does not need to sit on the landing dashboard. The director landing page is not a traditional dashboard — it is a cockpit. Primary job: answer "What do I need to do right now?" in zero scrolls. Secondary job: let the director navigate quickly to any area. Everything else is one tap away.

**Separation of concerns:**

| Concept | Location | Purpose |
|---|---|---|
| Daily Command | `/director` (landing) | Action-first, no-scroll, above-the-fold answers |
| Dashboard / Analytics | Collapsed sections on landing | On-demand detail — open only when needed |

---

## What changed

**Single file modified:** `src/app/director/page.tsx`

### Before Sprint 813

The `/director` landing page rendered 12 sections sequentially, requiring significant vertical scroll to reach all content. Sessions, Quick Actions, KPI cards, Alerts, Analytics, and KPI Health were all displayed expanded at page load.

### After Sprint 813

**Above the fold (no scroll required on desktop):**
1. Hero Header (date, greeting, nav links, Academy Health badge) — unchanged
2. DonnaDashboardOpenCard — unchanged
3. DirectorTodayCommandCenter — unchanged
4. **NEW: Today's Pulse strip** — 3 compact stat tiles

**Below the fold — 5 collapsed sections, all closed by default:**
5. Sessions This Week
6. Quick Actions
7. Academy Metrics (KPI cards + KPI Health)
8. Alerts & Placement (Pending Placement + Alert Breakdown + AI Suggestions)
9. Analytics (Health chart + Live Activity + Curriculum Coverage + NextBestAction)

**Bottom of page:**
10. Academy Setup (unchanged, conditional)

---

## Today's Pulse strip

Three at-a-glance tiles, each a direct `<Link>`:

| Tile | Value | Link | Color logic |
|---|---|---|---|
| Review queue | `pendingWrapUpsCount + newRequests` | `/director/review` | `text-status-orange` if > 0, else `text-text-secondary` |
| Players — attention | `attentionCount` | `/director/players` | `text-status-orange` if > 0, else `text-text-secondary` |
| Sessions this week | `sessionsThisWeek` | `/director/sessions` | Always `text-lime` |

No new data fetches — all three values were already derived from existing queries.

---

## CollapsibleSection component

Pure HTML `<details>`/`<summary>` — no client state, works as a Server Component.

```tsx
function CollapsibleSection({ title, badge, defaultOpen = false, children }) {
  return (
    <details open={defaultOpen || undefined} className="group">
      <summary className="list-none cursor-pointer ...">
        <ChevronDown className="... group-open:rotate-180" />
        <p>{title}</p>
        {badge > 0 && <span>{badge}</span>}
      </summary>
      <div className="pt-4 space-y-4">
        {children}
      </div>
    </details>
  )
}
```

**Key design decisions:**

| Decision | Rationale |
|---|---|
| `open={defaultOpen || undefined}` | `false \|\| undefined = undefined` — React does not render the attribute, so `<details>` starts closed |
| `className="group"` on `<details>` | Enables `group-open:` Tailwind variants on descendants |
| `group-open:rotate-180` on ChevronDown | CSS-only chevron flip — no JavaScript, no `useState` |
| All `defaultOpen={false}` | Landing must feel like a cockpit, not a scrolling dashboard. Director opens sections on demand. |
| `badge` prop on Alerts & Placement | Shows `totalAlerts` count on the collapsed header as an orange badge, preserving signal visibility even when collapsed |

---

## No data removed

All data and functionality previously visible on the dashboard is still present — it is collapsed, not deleted. Directors who want full detail can expand any section with one click. Nothing is hidden permanently.

---

## No data fetches changed

All Supabase queries are identical to pre-Sprint-813 state. The restructuring is purely presentational.

---

## Safety guardrails checklist

| Guard | Status |
|---|---|
| No DB mutation | ✅ Local React state only |
| No RLS change | ✅ Not touched |
| No localStorage | ✅ Not used |
| No sessionStorage | ✅ Not used |
| No DONNA routing changed | ✅ Not touched |
| No migrations | ✅ Not created |
| No package installs | ✅ Not installed |
| No data removed | ✅ Collapsed, not deleted |
| TypeScript clean | ✅ `npx tsc --noEmit` — no errors |

---

## Files changed in Sprint 813

- **Modified** `src/app/director/page.tsx` — restructured return JSX: Today's Pulse strip added, sections 4–12 wrapped in 5 `CollapsibleSection` panels (all closed by default), `CollapsibleSection` function added at bottom of file
- **Created** `docs/DIRECTOR_DAILY_COMMAND_LANDING_PAGE_813.md` — this document
- **Modified** `docs/CHANGELOG.md` — Sprint 813 entry
