# Sprint 1090 — DONNA Brian Alpha God Mode Sandbox V1

**Date:** 2026-06-01
**Sprint:** 1090

---

## Purpose

Allow Brian Dabul / Dabul Tennis Academy to test deeper DONNA intelligence during the pilot without risking mutations, parent sends, curriculum publishing, or official record changes. All sandbox outputs are labelled "Sandbox / Alpha Analysis" and produce only drafts, reports, and recommendations.

---

## Access Control

### Allowlist method: Environment variable

| Env var | Type | Description |
|---|---|---|
| `NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS` | Client-readable | Comma-separated academyId UUIDs allowed to use sandbox. Empty = disabled. |
| `NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ENABLED` | Client-readable | Optional explicit master switch (`true`/`false`). If absent, list alone determines access. |

**To enable for Brian:** Add Dabul Tennis Academy's live `academy_id` UUID to `NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS`.

**To disable:** Remove the UUID from the list or empty the env var entirely.

### Why env var + academyId (not email)

- `academyId` is already a prop on `DonnaAssistantButton` — zero layout changes needed
- `NEXT_PUBLIC_` vars are safe for academy IDs (not PII)
- Trivially disabled: clear the env var
- Future: add `DONNA_ALPHA_SANDBOX_EMAILS` (server-side, non-NEXT_PUBLIC) in `runDonnaOrchestratorAction` for email-level verification when needed

---

## Request Flow (post-Sprint 1090)

```
handleCommandSubmit
    │
    ├── ... (all deterministic handlers) ...
    │
    ├── [1090] Brian Alpha Sandbox gate          ← NEW (before Deep Mode gate)
    │    isBrianAlphaSandboxRequest(text)?
    │    ├── NO  → continue
    │    └── YES → isBrianAlphaSandboxAllowed({ academyId })?
    │               ├── YES → buildBrianAlphaSandboxDisclosure()
    │               │          setCommandResponse (label: "Sandbox / Alpha Analysis")
    │               │          speakDonna + recordTurn
    │               │          return ← God Mode NOT called yet
    │               └── NO  → buildBrianAlphaSandboxBlockedMessage()
    │                          setCommandResponse + return
    │
    ├── [1086] Deep Mode gate (unchanged)
    │
    └── handleGodModeQuery (unchanged)
```

---

## Sandbox Trigger Phrases

`isBrianAlphaSandboxRequest(text)` matches:
- "run brian alpha sandbox"
- "test donna god mode"
- "run sandbox academy audit"
- "run alpha deep analysis"
- "test alpha deep mode"
- "run dabul alpha analysis"
- Any phrase containing "alpha sandbox", "sandbox audit/mode/analysis", "donna alpha test"

---

## Sandbox Disclosure Behavior

`buildBrianAlphaSandboxDisclosure()` returns a three-part response:

1. **Confirmation** — "Sandbox / Alpha Analysis — authorized access confirmed."
2. **What DONNA will NOT do** (explicit list):
   - Change official player records or levels
   - Send parent or player communications
   - Publish curriculum changes
   - Modify rosters, billing, enrollment
   - Expose raw coach notes
3. **What DONNA produces** — drafts, signal summaries, recommendations, reports (labelled sandbox-only)
4. **Confirmation ask** — directs Brian to ask the specific question for deeper analysis

---

## After Disclosure — Director Confirms

When Brian replies with the specific question (e.g. "audit academy health", "review player bottlenecks"):
- It goes through `handleCommandSubmit` normally
- If the phrase doesn't match Deep Mode gate (most specific questions won't), it reaches God Mode
- God Mode processes it with the page-filtered tool manifest (Sprint 1081) and history filter (Sprint 1083)
- Output is AI-generated analysis — Brian reviews it; nothing is applied automatically

---

## Safety Invariants

- No mutations in sandbox (same as all God Mode paths — DONNA never directly mutates)
- Deep Mode gate still fires for broad phrasing if not preceded by sandbox disclosure
- Token logging (Sprint 1080) unchanged — sandbox calls are logged as normal God Mode calls
- Retrieval budget caps (Sprint 1089) apply — sandbox does not bypass budgets
- `proposed_actions` pipeline unchanged — any draft actions still require director approval

---

## Disabling Sandbox Access

To remove Brian's access:
1. Remove his academy's UUID from `NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ACADEMY_IDS`
2. Or set `NEXT_PUBLIC_DONNA_ALPHA_SANDBOX_ENABLED=false`

Both changes take effect on next deploy/restart. No code changes required.
