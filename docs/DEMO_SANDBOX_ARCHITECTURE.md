# Demo Sandbox Architecture

**Sprint:** 111
**Date:** 2026-05-01

---

## Purpose

The Demo Sandbox lets a director (or a product demo session) click through real Academy OS
workflows using sample data, without touching real player records or sending any communications.

This is NOT a static mockup. It uses real database tables, real server actions, real UI
components — the same code paths Brian will use with real players. The difference is that all
records are clearly tagged as demo data and can be reset or deleted at any time.

---

## Why Real Sandbox Data Is Better Than Static Mockups

| Static Mockup | Real Demo Sandbox |
|---|---|
| Looks like the product | IS the product |
| Requires separate maintenance | Updates automatically as code ships |
| Can't demonstrate real interactions | Real approve/apply/reset flows work |
| Can't show edge cases | Shows exactly what the system does |
| Director can't trust it | Director can trust it — same code |

---

## Isolation Strategy

**Naming convention isolation** — all demo records use a strict `[DEMO]` prefix in primary name fields.

| Table | Isolation Field | Example |
|---|---|---|
| `players` | `first_name` | `[DEMO] Mia` |
| `groups` | `name` | `[DEMO] Orange 2 Sample Group` |
| `templates` | `name` | `[DEMO] Orange 2 Direction + Return Start` |
| `sessions` | `name` | `[DEMO] Orange 2 Adaptive Session` |
| `academy_curriculum_versions` | `name` | `[DEMO] Dabul Academy Curriculum` |

Delete queries match `ILIKE '[DEMO]%'` on the isolation field, within the academy's scope.

No separate demo academy is created. Demo records live in the director's real academy but are
clearly labeled and scoped for safe deletion.

---

## Why No Separate Demo Academy

A separate demo academy would require:
- A new `academies` row with a unique slug
- A new `academy_memberships` row for the current user in the demo academy
- All queries on the demo page to use the demo academy_id, not the user's profile academy_id
- Risk: if membership setup fails, RLS blocks all demo queries

The naming convention approach:
- No new academy needed
- RLS works as normal (user is already a member of their real academy)
- Demo data visible in existing UI pages (sessions, players lists) with `[DEMO]` label
- Reset is a single pass of DELETE queries filtered by prefix

---

## Records Allowed in Demo

| Record Type | Allowed | Notes |
|---|---|---|
| Players (with `[DEMO]` prefix) | Yes | No real personal data |
| Groups (with `[DEMO]` prefix) | Yes | No real group data |
| Group memberships (demo players + groups) | Yes | Cascade-deleted with players |
| Templates (with `[DEMO]` prefix) | Yes | No global template mutation |
| Template blocks (for demo template) | Yes | Cascade-deleted with template |
| Sessions (with `[DEMO]` prefix) | Yes | `coach_id` = acting user |
| Session blocks (for demo session) | Yes | Cascade-deleted with session |
| Player development summaries (demo players) | Yes | Private, not shown to parent/player |
| Player priorities (demo players) | Yes | Category: `technical_skill` |
| Player curriculum states (demo players) | Yes | Only if matching level found |
| Academy curriculum versions (with `[DEMO]` prefix) | Yes | Academy-scoped only |
| Academy curriculum overrides (for demo version) | Yes | Cascade-deleted with version |
| Session adjustment suggestions (for demo session) | Yes | Generated on demand |

---

## Records Forbidden in Demo

| Record Type | Reason |
|---|---|
| Real player mutations | Never touch real player records |
| Guardian / parent accounts | No parent data in demo |
| Billing records | No billing in demo |
| Medical / private notes | No sensitive data in demo |
| Communications | No emails/push/SMS |
| New academy + academy_memberships | RLS complexity, risk of orphan data |
| Global curriculum mutations | Protected — master curriculum never touched |
| Master template mutations | `template_blocks` on non-demo templates never touched |

---

## Cascade Delete Map

Deleting demo records in this order avoids FK violations:

```
1. session_adjustment_suggestions  (WHERE session_id IN demo session IDs)
2. sessions                        (WHERE name ILIKE '[DEMO]%' AND academy_id = :id)
                                   → session_blocks CASCADE on delete
3. templates                       (WHERE name ILIKE '[DEMO]%' AND academy_id = :id)
                                   → template_blocks CASCADE on delete
4. players                         (WHERE first_name ILIKE '[DEMO]%' AND academy_id = :id)
                                   → group_memberships CASCADE on delete
                                   → player_priorities CASCADE on delete
                                   → player_development_summary CASCADE on delete
                                   → player_curriculum_states CASCADE on delete
5. groups                          (WHERE name ILIKE '[DEMO]%' AND academy_id = :id)
6. academy_curriculum_versions     (WHERE name ILIKE '[DEMO]%' AND academy_id = :id)
                                   → academy_curriculum_overrides CASCADE on delete
```

---

## How Demo Data Connects to Real Workflows

| Demo Record | Real Workflow It Demonstrates |
|---|---|
| Demo players with dev profiles | Player Import → Development Intake → Onboarding Review |
| Demo group with members | Group Assignment → Coach Class Intelligence |
| Demo template + session | Session Builder → Coach Briefing → Session View |
| Demo curriculum version | Curriculum Clone → Voice Customization → Review Queue |
| Demo session suggestions | Adaptive Suggestions → Approve/Apply → Session Impact |

The demo page links directly to real pages:
- `/director/players` (filtered to show demo players)
- `/director/sessions/{demoSessionId}` (real session page)
- `/director/curriculum` (real curriculum page)
- `/director/review` (real review queue)

---

## Demo Tour Explains

- This is sample data — nothing affects real records
- Once the real roster is uploaded, the same workflows run with real players
- Strengths/needs drive suggestions — demo shows exactly how that looks
- Curriculum customization is typed/voice → draft → director review → applied
- Adaptive suggestions are human-reviewed, never auto-applied

---

## How to Prevent Demo Data Mixing with Real Data

1. `[DEMO]` prefix is visually obvious in all listings
2. Demo page shows a clear "Preview Mode" banner
3. Reset/delete is scoped to `[DEMO]` prefix only — real records cannot be accidentally deleted
4. Confirmation checkbox required before any delete

---

## Recommended Sprint Path

| Sprint | Goal |
|---|---|
| 111 | Architecture doc (this file) |
| 112 | Reset strategy + safety doc |
| 113 | Demo seed server action |
| 114 | Demo reset/delete client component |
| 115 | Demo tour landing page |
| 116 | Player + development profile walkthrough section |
| 117 | Curriculum customization section |
| 118 | Session + coach intelligence section |
| 119 | Adaptive suggestions section |
| 120 | QA + Brian demo script |
