# Templates Prototype Port Audit

**Sprint:** 920
**Date:** 2026-05-18
**Status:** Audit complete — build approved

---

## 1. Prototype source status

The Manus prototype zip file (`Academy_OS_Master_Build/academyos-templates-prototype.zip`) was **empty (0 bytes)** at audit time. All design decisions for the Templates UI Port Block are therefore derived from:

- The sprint plan descriptions (Sprints 921–934)
- Existing AcademyOS curriculum builder pages (aesthetic reference)
- Existing `/director/class-templates/` and `/director/fitness/templates/` pages (data model reference)
- AcademyOS design system (`tailwind.config.ts`, `globals.css`, `src/components/ui/`)

---

## 2. Existing template routes (pre-sprint state)

| Route | Status | Notes |
|---|---|---|
| `/director/templates` | Built (Sprint 919) | Home page with DONNA hero, actions, stats, category cards |
| `/director/class-templates` | Built (pre-919) | Full library with real DB queries |
| `/director/class-templates/new` | Built | Real creation form |
| `/director/class-templates/[templateId]` | Built | Full detail editor with lesson plan generator |
| `/director/fitness/templates` | Built | Full library with real DB queries |
| `/director/fitness/templates/new` | Built | Real creation form |
| `/director/fitness/templates/[templateId]` | Built | Full detail editor |

---

## 3. New routes to build (Sprints 921–931)

All new routes live under `/director/templates/` for a unified, modern hierarchy.

| Route | Sprint | Type | Data |
|---|---|---|---|
| `/director/templates` | 921 | Update links | Existing page |
| `/director/templates/class` | 923 | New page | Mock/demo |
| `/director/templates/class/create` | 925 | New page | Mock/demo, no writes |
| `/director/templates/class/[templateId]` | 926 | New page | Mock/demo |
| `/director/templates/fitness` | 924 | New page | Mock/demo |
| `/director/templates/fitness/create` | 927 | New page | Mock/demo, no writes |
| `/director/templates/fitness/[templateId]` | 928 | New page | Mock/demo |
| `/director/templates/coach-preview` | 929 | New page | Mock/demo |
| `/director/templates/impact-preview` | 930 | New page | Mock/demo, read-only |
| `/director/templates/donna-suggestions` | 931 | New page | Mock/demo |

---

## 4. Reusable components to create

| Component | Sprint | Purpose |
|---|---|---|
| `src/components/templates/TemplateDonnaPanel.tsx` | 922 | Right panel, mode-aware |
| `src/lib/templates/templateMockData.ts` | 923 | Shared demo data |
| `src/components/templates/TemplateLibraryCard.tsx` | 923 | Library card for class/fitness |
| `src/components/templates/TemplateBlockCard.tsx` | 926 | Block display in detail view |
| `src/components/templates/TemplateImpactCard.tsx` | 930 | Impact preview cards |
| `src/components/templates/TemplateSuggestionCard.tsx` | 931 | DONNA suggestion cards |

---

## 5. Build priority order

1. **Sprint 922** — `TemplateDonnaPanel` (all pages depend on it)
2. **Sprint 921** — Fix home page route links (unblocks navigation)
3. **Sprint 923** — Class library (most common entry point)
4. **Sprint 924** — Fitness library
5. **Sprint 925** — Class create flow
6. **Sprint 926** — Class detail editor
7. **Sprint 927** — Fitness create flow
8. **Sprint 928** — Fitness detail editor
9. **Sprint 929** — Coach preview
10. **Sprint 930** — Impact preview
11. **Sprint 931** — DONNA suggestions
12. **Sprint 932** — Route QA doc
13. **Sprint 933** — Polish pass
14. **Sprint 934** — Completion audit

---

## 6. Mock/demo data only

All new routes in Sprints 921–931 use **mock/demo data only**. No database writes, no schema changes, no migrations.

Mock data must be labeled:
- `demo-only`
- `local-only`
- `not saved`
- `not applied`

Real backend wiring for new routes is deferred to a future sprint block after the UI is validated.

---

## 7. What to connect to backend later

| Feature | What needs wiring |
|---|---|
| Class library | Real templates from `templates` table filtered by tags |
| Fitness library | Real templates from `templates` table with fitness tag |
| Class create | `createClassTemplateAction` server action |
| Fitness create | Fitness template creation action |
| Detail editor | Real template data from `template_blocks` |
| Impact preview | Real session projection data |
| DONNA suggestions | Rule-based suggestion engine |

---

## 8. Risks if Manus code were copied directly

1. **Wrong router** — Manus uses Wouter, AcademyOS uses Next.js App Router
2. **Wrong UI library** — Manus has its own components; AcademyOS uses custom `src/components/ui/`
3. **Wrong branding** — Manus may use different product names/colors
4. **Wrong auth pattern** — Manus is a prototype with no real auth
5. **CSS conflicts** — Manus uses a different CSS approach
6. **No RLS** — Manus has no Supabase RLS; direct copy would bypass academy isolation
7. **Static data hardcoded** — Manus uses hardcoded data that would look like real academy data

All of the above are mitigated by the approach of using only visual/layout reference from the prototype and rebuilding from scratch in AcademyOS conventions.

---

## 9. Sprint plan 921–934

| Sprint | Deliverable |
|---|---|
| 921 | Templates Home — fix route links, DONNA panel update |
| 922 | Template DONNA Panel Shell (reusable component) |
| 923 | Class Templates Library V1 (mock data) |
| 924 | Fitness Templates Library V1 (mock data) |
| 925 | Create Class Template Guided Flow V1 |
| 926 | Class Template Detail Editor V1 |
| 927 | Create Fitness Template Guided Flow V1 |
| 928 | Fitness Template Detail Editor V1 |
| 929 | Template Coach Preview V1 |
| 930 | Template Impact Preview V1 |
| 931 | DONNA Template Suggestions V1 |
| 932 | Templates Route Navigation QA V1 |
| 933 | Templates Mobile Desktop Polish V1 |
| 934 | Templates V1 Completion Audit V1 |
