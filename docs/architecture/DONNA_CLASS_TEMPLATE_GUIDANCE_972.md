# DONNA Class Template Guidance — Sprint 972

**Date:** 2026-05-30
**Sprint:** 972
**Status:** Implemented — TypeScript clean

---

## What Was Built

Sprint 972 makes DONNA guide directors through class template decisions. DONNA can now answer template-specific questions and the template chip sets are expanded.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/lib/donna/classTemplateGuidance.ts` | Created — deterministic class template guidance builder |
| `src/lib/donna/donnaPageChipRegistry.ts` | Modified — 3 new chips on template detail, 1 on template list |
| `src/components/assistant/DonnaAssistantButton.tsx` | Modified — import + handler in `detectAndHandleCommand` |

---

## Guidance Intent Coverage

| Intent | Trigger Phrases |
|---|---|
| `explain_template` | "explain this template", "what is a class template", "what does this template do" |
| `template_readiness` | "is this template ready", "template readiness", "is the template complete" |
| `explain_blocks` | "what are blocks", "explain blocks", "explain block structure", "how do blocks work" |
| `create_session_from_template` | "create session from template", "how do I use this template", "generate a session" |
| `explain_template_list` | "what is the template library", "explain template list", "template library" |

---

## Chip Sets (Post-972)

### Template Detail (`/director/class-templates/[id]`)

| ID | Label | Action |
|---|---|---|
| `tpl-primary` | Highlight primary action | highlight |
| `tpl-blocks` | Highlight block list | highlight |
| `tpl-draft` | Highlight review draft | highlight |
| `tpl-next` | What should I do next? | prompt |
| `tpl-explain` | Explain this template | prompt (new) |
| `tpl-session` | Create session from template | prompt (new) |
| `tpl-blocks-explain` | Explain block structure | prompt (new) |

### Template List (`/director/class-templates`)

| ID | Label | Action |
|---|---|---|
| `tpl-list-create` | Highlight create button | highlight |
| `tpl-list-all` | Highlight template list | highlight |
| `tpl-list-explain` | What is the template library? | prompt (new) |

---

## Key Guidance Points

- **Template readiness:** Name + at least one block + optional curriculum level link
- **Blocks:** Duration-based sections; changes don't affect already-generated sessions
- **Create session from template:** Safe workflow — director selects date/group/coach; no session created automatically
- **Template library:** Director-approved blueprints reusable across sessions

---

## No-Mutation / No-Migration Guarantee

- Pure TypeScript guidance helper — no DB, no API, no mutations
- No template records changed
- No sessions created by guidance helper
- No schema changes
