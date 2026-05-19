# DONNA Onboarding — Native Shell V1

**Date:** 2026-05-19
**Sprint:** O-3

---

## Summary

Created the AcademyOS-native onboarding shell at `/onboarding`. The shell provides a full-screen 7-step onboarding experience without the director sidebar. DONNA panel is persistent on desktop (320px right column), collapsible on mobile.

---

## Files Created

| File | Purpose |
|---|---|
| `src/app/onboarding/page.tsx` | Route entry point — renders OnboardingShell |
| `src/components/onboarding/OnboardingShell.tsx` | Main shell with 7-step state, welcome step, placeholder steps 2–7 |
| `src/components/onboarding/OnboardingDonnaPanel.tsx` | Persistent DONNA panel — message, step progress, DNA preview |
| `src/components/onboarding/OnboardingProgressRail.tsx` | Horizontal 7-step progress rail with node indicators |
| `src/components/onboarding/OnboardingStepHeader.tsx` | Reusable step header with eyebrow, title, subtitle |

---

## Layout

```
[Progress Rail — full width at top]
[Main Content (flex-1, scrollable)] [DONNA Panel (320px, desktop only)]
[Mobile DONNA toggle bar at bottom]
```

- Desktop: DONNA panel always visible on right
- Mobile: DONNA panel collapsed below content, expandable via toggle button
- Progress rail: horizontal strip with 7 nodes, labels, connectors

---

## Welcome Step (Step 1) — Functional

The Welcome step is fully interactive:
- Eyebrow: "AcademyOS — Director Onboarding"
- Headline: "Tell DONNA how your academy works."
- Subtitle: "DONNA builds your starting operating system."
- 6 setup mode cards (Fast Start, Guided Setup, Full Setup, Import Existing, Consultant Setup, Multi-Location)
- "Start with DONNA" CTA (enabled after mode selection)
- "Use recommended defaults" secondary CTA
- Safety copy: "All selections are saved as a draft. Nothing is applied until you reach the Activation Checklist."

---

## Steps 2–7 — Placeholder

Steps 2–6 show a centered placeholder card: "This step is being built in the next sprint."
Step 7 (Activate) shows a lime info card: "Activation Checklist coming in Sprint O-10."
Navigation (Back / Continue) works for all steps.

---

## DONNA Panel Behavior

- Shows DONNA avatar (Sparkles icon), name, title
- Shows step-specific message (7 messages defined)
- Shows step progress list (completed / active / upcoming with icons)
- Shows live Academy DNA preview (builds up as draft state fills)
- Shows "Why This Matters" and "Next Best Action" per step
- Bottom: principle quote + "Draft only — not applied"

---

## State Model

`OnboardingDraft` interface is exported from `OnboardingShell.tsx` and used by `OnboardingDonnaPanel.tsx`. All state lives in React `useState` — no backend writes. Default parent visibility rules: all privacy options set to `true` (safe defaults).

---

## Safety Rules Applied

- No DB writes in this shell
- No fake "applied" language
- "Draft only" shown in multiple places
- Principle quote: "DONNA proposes. Directors approve. Nothing changes until confirmed."
- "Use recommended defaults" does NOT skip to activation — it advances to step 2

---

## Route

- URL: `/onboarding`
- Not embedded in director sidebar layout
- Accessible to any authenticated user (middleware redirects unauthenticated users to `/login`)
- Director-specific content (future sprints may add auth role check)
