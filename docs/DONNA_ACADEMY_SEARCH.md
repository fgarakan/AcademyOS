# DONNA Academy Search

> Sprint 468 — Academy Search V1
> See also: `src/lib/donna/search/academySearch.ts`

---

## Search areas by role

| Area | Director | Head Coach | Coach | Player | Parent |
|---|---|---|---|---|---|
| players | ✓ | ✓ | ✓ | — | — |
| groups | ✓ | ✓ | ✓ | — | — |
| sessions | ✓ | ✓ | ✓ | — | — |
| templates | ✓ | — | — | — | — |
| curriculum | ✓ | — | — | — | — |

Players and parents do not use DONNA academy search — they have role-specific portal views.

---

## Search rules

- All searches are scoped by academy_id
- All searches respect is_active = true on the queried tables
- Relevance is scored deterministically — no vector/semantic search in V1
- Maximum 20 combined results per search call
- Player search: ilike on full_name only — no internal notes searched
- No raw coach_notes or parent_summaries are searchable by DONNA

---

## Main function

`searchAcademy(db, query, academyId, role, areas?)`:
- Multi-area parallel search
- Returns combined sorted results
- Each result has: id, area, label, description, href, relevanceScore

---

## Relevance scoring (deterministic)

| Match type | Score |
|---|---|
| Exact match | 100 |
| Starts with query | 90 |
| Contains query | 70 |
| Word-level partial match | 0–50 |

---

## Future semantic search

For Sprint 500+:
- Vector embeddings for curriculum requirements
- Fuzzy player name matching
- Requires: pgvector extension, embedding pipeline
- Not implemented in V1 — deterministic text search only
