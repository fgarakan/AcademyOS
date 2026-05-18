# Director DONNA Command Center
Sprint 1004 — 2026-05-18

## Summary

Created `src/app/director/donna/page.tsx` — the main Director DONNA entry point.

## Route

`/director/donna`

## What It Shows

- DONNA header with Director Mode badge and live/demo data indicator
- DONNA greeting with pending review count alert
- Six quick-link cards (Review Queue, Today, Players, Curriculum, Academy Intelligence, Templates)
- Eight suggested DONNA questions (links to COO intelligence demo)
- Review-first safety notice

## Data Sources

- `proposed_actions` count (pending_review, scoped to academy_id) — live when authenticated
- `sessions` count for today — live when authenticated
- Falls back to demo gracefully when user/academy not resolved

## What This Is NOT

- Not a free chat UI (that is Sprint 1030)
- Not a replacement for the existing full DONNA panel (`DonnaAssistantButton`)
- Not a duplication of `/director/donna-coo-demo` (links to it instead)

## Gaps

- Question chips link to `/director/donna-coo-demo` (COO intelligence) rather than inline answers — full conversational layer is Sprint 1030+
- Sidebar entry point not yet wired (SidebarNav not modified this sprint)
